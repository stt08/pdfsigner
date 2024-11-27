const { generateCertificate } = require('./certificate');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Schema } = mongoose;
require('dotenv').config();

// == == == == == == == == == == == == == == == == == == == == //

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin']
    },
    password: String,
    certificates: [{
        name: String,
        data: Buffer,
    }]
});

const sessionSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    key: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '12h'
    }
});
// == == == == == == == == == == == == == == == == == == == == //

const admin = {
    fullName: 'Admin',
    role: 'admin',
    email: process.env.ADMIN_EMAIL.toLowerCase() || 'admin',
    password: bcrypt.hashSync(
        process.env.ADMIN_PASSWORD || 'pdfsignerexamplepassword', 10
    )
};

// == == == == == == == == == == == == == == == == == == == == //

const User = mongoose.model('User', userSchema);
const Session = mongoose.model('Session', sessionSchema);

// == == == == == == == == == == == == == == == == == == == == //

module.exports = {
    connect: async () => {
        try {
            await mongoose.connect(process.env.MONGO_URI, {})
            console.log('Connected to MongoDB!');
        } catch (e) {
            console.error('Error connecting to MongoDB!', e);
            process.exit(1);
        }
        
        if (!(await User.findOne({ email: admin.email }))) {
            const newAdmin = await new User(admin).save();
            const certAdmin = await generateCertificate(newAdmin._id.toString());
            newAdmin.certificates = [{
                name: 'default',
                data: certAdmin
            }];
            return await newAdmin.save();
        }
    },

    getUsers: () => {
        return User.find().sort({ role: 1 });
    },

    getUserById: (id) => {
        try {
            return User.findById(id);
        } catch (e) {
            return null;
        }
    },

    updateUser: async (id, field, data) => {
        const user = await User.findById(id);
        if (!user) {
            return null;
        }

        if(field === 'role') {
            user.set({ role: data });
        }
        else if(field === 'password') {
            user.set({ password: bcrypt.hashSync(data, 10) });
        }
        else if (field === 'fullName') {
            user.set({ fullName: data });
        }
        else if (field === 'email') {
            user.set({ email: data });
        }
        return await user.save();
    },

    changePasswordSelf: async (id, password, newPassword) => {
        const user = await User.findById(id);
        if (!user) {
            return null;
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return null;
        }

        user.password = bcrypt.hashSync(newPassword, 10);
        return await user.save();
    },

    accessUser: async (fullName, email) => {
        email = email.toLowerCase();
        
        const user = await User.findOne({ email: email });
        if (!user) {
            // creation of new user
            const newUser = await new User({
                fullName, email, role: 'user'
            }).save();

            // insert a certificate for the new user
            const newCertificate = await generateCertificate(newUser._id.toString());
            newUser.certificates = [{
                name: 'default',
                data: newCertificate
            }];
            return await newUser.save();
        }
        // update from MS OAuth
        user.fullName = fullName;
        return await user.save();
    },

    createSession: async (userId) => {
        const key = new Array(
                ...crypto.getRandomValues(new Uint8Array(32))
            )
            .map(x => x.toString(16).padStart(2, '0'))
            .join('');
        return new Session({ userId, key }).save();
    },

    createUser: async (email, fullName, password, role) => {
        const newUser = await new User({
            fullName, email, role, password: bcrypt.hashSync(password, 10)
        }).save();

        const cert = await generateCertificate(newUser._id.toString());
        newUser.certificates = [{
            name: 'default',
            data: cert
        }];
        return await newUser.save();
    },

    deleteSession: async (key) => {
        await Session.deleteOne({ key });
    },

    getMe: async (key) => {
        const session = await Session.findOne({ key });
        if (!session) {
            return null;
        }

        const user = await User.findById(session.userId);
        if (!user) {
            return null;
        }
        
        hasPassword = user.password ? true : false;
        certificates = user.certificates.map(certificate => certificate.name);
        return { fullName: user.fullName, email: user.email, role: user.role, certificates, hasPassword, _id: user._id.toString() };
    },

    getUserBySession: async (key) => {
        const session = await Session.findOne({ key });
        if (!session) {
            return null;
        }

        return await User.findById(session.userId);
    },

    loginWithPassword: async (email, password) => {
        const user = await User.findOne({ email });
        if (!user) {
            return null;
        }

        if (!user.password) {
            return null;
        }

        if (!bcrypt.compareSync(password, user.password)) {
            return null;
        }

        return user;
    },

    addCertificate: async (userId, certificateName, certificateData) => {
        const user = await User.findById(userId);
        if (!user) {
            return null;
        }

        user.certificates.push({ name: certificateName, data: certificateData });
        return await user.save();
    },

    removeCertificate: async (userId, certificateIndex, certificateName) => {
        const user = await User.findById(userId);
        if (!user) {
            return null;
        }

        const certificate = user.certificates[certificateIndex];
        if (!certificate || certificate.name !== certificateName) {
            return null;
        }

        user.certificates.splice(certificateIndex, 1);
        return await user.save();
    },

    deleteUser: async (userId) => {
        const user = await User.findById(userId);
        if (!user) {
            return null;
        }

        return await user.deleteOne();
    }
}