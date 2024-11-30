const path = require('path');
const multer = require('multer');
const express = require('express');
const nodemailer = require('nodemailer');
const cookieParser = require('cookie-parser');

const { signPdf, verifyPdf } = require('./lib/pdfsigner');
const Mongo = require('./lib/mongo');
const OAuth = require('./lib/oauth');

// == == == == == == == == == == == == == == == == == == == == //
//      Checking environment variables to be set properly      //

if (!process.env.TENANT_ID || !process.env.CLIENT_ID || !process.env.CLIENT_SECRET) {
    console.error('Please set details for Microsoft OAuth in .env file');
    process.exit(1);
}

if (!process.env.MONGO_URI) {
    console.error('Please set MongoDB URI in .env file');
    process.exit(1);
}

if (!process.env.CERT_PASS || !process.env.CERT_COMMON_NAME || !process.env.CERT_COUNTRY
    || !process.env.CERT_STATE || !process.env.CERT_LOCALITY || !process.env.CERT_ORGANIZATION
    || !process.env.CERT_ORGANIZATION_UNIT || !process.env.CERT_URI) {
    
    console.error('Please set certificate details in .env file');
    process.exit(1);
}

if (!process.env.EMAIL_HOST || !process.env.EMAIL_PORT
    || !process.env.EMAIL || !process.env.EMAIL_PASSWORD) {

    console.error('Please set email details in .env file');
    process.exit(1);
}

// == == == == == == == == == == == == == == == == == == == == //

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const port = process.env.PORT || 3000;
const app = express();
app.use(cookieParser());

Mongo.connect()

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD
    },
});

// == == == == == == == == == == == == == == == == == == == == //
const api = express.Router();

api.get('/users', async (req, res) => {
    try {
        const info = await Mongo.getMe(req.cookies.token);
        if (!info || info.role !== 'admin') {
            res.status(401).send('Unauthorized');
            return;
        }
    
        res.send(await Mongo.getUsers());
    } catch (error) {
        console.log(error);
    }
});

api.get('/users/me', async (req, res) => {
    try {
        const info = await Mongo.getMe(req.cookies.token);
        if (!info) {
            res.status(401).send('Unauthorized');
            return;
        }
    
        res.send(info);
    } catch (error) {
        console.log(error);
    }
});

api.post('/users/login', express.json(), async (req, res) => {
    try {
        const user = await Mongo.loginWithPassword(req.body.email, req.body.password);
        if (!user) {
            res.status(401).send('Unauthorized');
            return;
        }
    
        const session = await Mongo.createSession(user._id);
        res.cookie('token', session.key, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.send('Logged in!');
    } catch (error) {
        console.log(error);
    }
});

api.post('/users/logout', async (req, res) => {
    try {
        await Mongo.deleteSession(req.cookies.token);
        res.clearCookie('token');
        res.end();
    } catch (error) {
        console.log(error);
    }
});

api.get('/users/:id', async (req, res) => {
    try {
        const info = await Mongo.getMe(req.cookies.token);
        if (!info || info.role !== 'admin') {
            res.status(401).send('Unauthorized');
            return;
        }
    
        const user = await Mongo.getUserById(req.params.id);
        if (!user) {
            res.status(404).send('User not found');
            return;
        }
    
        res.send(user);
    } catch (error) {
        console.log(error);
    }
});

api.delete('/users/me', async (req, res) => {
    try {
        const info = await Mongo.getMe(req.cookies.token);
        if (!info) {
            res.status(401).send('Unauthorized');
            return;
        }
    
        await Mongo.deleteUser(info._id);
    } catch (error) {
        console.log(error);
    }
});

api.delete('/users/:id', async (req, res) => {
    try {
        const info = await Mongo.getMe(req.cookies.token);
        if (!info || info.role !== 'admin') {
            res.status(401).send('Unauthorized');
            return;
        }
    
        await Mongo.deleteUser(req.params.id);
    } catch (error) {
        console.log(error);
    }
});

api.post('/users/me', express.json(), async (req, res) => {
    try {
        const info = await Mongo.getMe(req.cookies.token);
        if (!info) {
            res.status(401).send('Unauthorized');
            return;
        }
    
        const data = req.body.data;
        const field = req.body.field;
        await Mongo.updateUser(info._id, field, data);
        res.send('Updated');
    } catch (error) {
        console.log(error);
    }
});

api.post('/users/:id', express.json(), async (req, res) => {
    try {
        const info = await Mongo.getMe(req.cookies.token);
        if (!info || info.role !== 'admin') {
            res.status(401).send('Unauthorized');
            return;
        }
    
        const id = req.params.id;
        const data = req.body.data;
        const field = req.body.field;
        await Mongo.updateUser(id, field, data);
        res.send('Updated');
    } catch (error) {
        console.log(error);
    }
});

api.post('/users', express.json(), async (req, res) => {
    try {
        const info = await Mongo.getMe(req.cookies.token);
        if (!info || info.role !== 'admin') {
            res.status(401).send('Unauthorized');
            return;
        }
    
        const email = req.body.email;
        const fullName = req.body.fullName;
        const password = req.body.password;
        const role = req.body.role;
        await Mongo.createUser(email, fullName, password, role);
    } catch (error) {
        console.log(error);
    }
});

api.get('/oauth', async (req, res) => {
    try {
        res.redirect(await OAuth.getAuthUrl(req.query.next));
    } catch (error) {
        console.log(error);
    }
});

api.get('/oauth/redirect', async (req, res) => {
    try {
        const tokenResponse = await OAuth.acquireTokenByCode(req.query.code);
        if (!tokenResponse) {
            res.send('Error acquiring token!');
            return;
        }
    
        const user = await Mongo.accessUser(
            tokenResponse.account.name,
            tokenResponse.account.username
        );
    
        const session = await Mongo.createSession(user._id);
        res.cookie('token', session.key, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        const state = JSON.parse(req.query.state || '{}');
        res.redirect(state.next ? decodeURIComponent(state.next) : '/');
    } catch (error) {
        console.log(error);
    }
});

// receives PDF file (var: pdf) and signatures (var: signatures)
api.post('/sign/create', upload.fields([
    { name: 'pdfs', maxCount: 100 },
    { name: 'signatures', maxCount: 1 },
    { name: 'certificate', maxCount: 1 }
]), async (req, res) => {
    try {
        const pdfs = req.files['pdfs']; //.map(file => file.buffer);
        const signatures = JSON.parse(req.body.signatures);

        console.log(signatures);
    
        const user = await Mongo.getUserBySession(req.cookies.token);
        if (!user) {
            res.status(401).send('Unauthorized');
            return;
        }
    
        const password = user._id.toString();
        const certificate = user.certificates[0].data;
        const location = `${process.env.CERT_ORGANIZATION}, ${process.env.CERT_LOCALITY}.`;
        const info = {
            name: user.fullName || 'Unauthorized User',
            contactInfo: user.email || 'Unauthorized User',
            location: location || 'Unknown Location',
            reason: 'Document was signed by ' + user.fullName,
        };
    
        let idx = 0;
        const results = [];
        for (const pdf of pdfs) {
            const filteredSignatures = signatures.filter(sign => sign.file === idx);
            const signedPdf = await signPdf(pdf.buffer, certificate, password, info, filteredSignatures);
            results.push({
                buffer: signedPdf,
                initialName: pdf.originalname,
                name: pdf.originalname.replace('.pdf', `_signedAt_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.pdf`)
            });
            idx++;
        }
        res.send(results);
    } catch (error) {
        console.log(error);
    }
});

api.post('/sign/send', upload.fields([
    { name: 'pdfs', maxCount: 100 },
    { name: 'email', maxCount: 1 }
]), async (req, res) => {
    try {
        const pdf = req.files['pdfs'];
        const email = req.body.email;
    
        const user = await Mongo.getUserBySession(req.cookies.token);
        if (!user) {
            res.status(401).send('Unauthorized');
            return;
        }
    
        const attachments = pdf.map(file => {
            return {
                filename: file.originalname,
                content: file.buffer
            };
        });
    
        const info = await transporter.sendMail({
            from: `"PDF Signer" <${process.env.EMAIL}>`, // sender address
            to: email,
            subject: "Signed PDF Document from " + user.fullName, // Subject line
            text: "Please find the document signed by " + user.fullName + " attached.", // plain text body
            html: "<b>Document is attached</b>", // html body
            attachments: attachments
        });
    
        res.send(info);
    } catch (error) {
        console.log(error);
    }
});

api.post('/sign/certificate', upload.fields([
    { name: 'title', maxCount: 1 },
    { name: 'certificate', maxCount: 1 }
]), async (req, res) => {
    try {
        const certificate = req.files['certificate'][0].buffer;
        const title = req.body.title;
    
        const user = await Mongo.getUserBySession(req.cookies.token);
        if (!user) {
            res.status(401).send('Unauthorized');
            return;
        }
    
        await Mongo.addCertificate(user._id, title, certificate);
    } catch (error) {
        console.log(error);
    }
});

api.delete('/sign/certificate', async (req, res) => {
    try {
        const user = await Mongo.getUserBySession(req.cookies.token);
        if (!user) {
            res.status(401).send('Unauthorized');
            return;
        }
    
        await Mongo.removeCertificate(user._id, req.body.index, req.body.title);
    } catch (error) {
        console.log(error);
    }
});

api.get('/verify-pdf', async (req, res) => {
    try {
        res.sendFile(__dirname + '/verify.html');
    } catch (error) {
        console.log(error);
    }
});

api.post('/verify-pdf', upload.single('pdfFile'), async (req, res) => {
    try {
        const pdfFile = req.file.buffer;
        const verificationResult = await verifyPdf(pdfFile);
        res.send(verificationResult);
    } catch (error) {
        console.log(error);
    }
});

app.use('/api', api);
// == == == == == == == == == == == == == == == == == == == == //

// static serve public folder (+ extra options)
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => console.log(`Active on port ${port}!`));