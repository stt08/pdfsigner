const forge = require('node-forge');

require('dotenv').config();

/*  
 * Method generates a certificate that is used to sign PDFs.
 * It is being used once after a successful registration of user
 */
function generateCertificate(password) {
    // generates a new key pair
    let keys = forge.pki.rsa.generateKeyPair(2048);
    let cert = forge.pki.createCertificate();

    // assigns properties to the certificate
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    // assigns attributes from environment variables
    let attrs = [{
        name: 'commonName',
        value: process.env.CERT_COMMON_NAME
    }, {
        name: 'countryName',
        value: process.env.CERT_COUNTRY
    }, {
        shortName: 'ST',
        value: process.env.CERT_STATE
    }, {
        name: 'localityName',
        value: process.env.CERT_LOCALITY
    }, {
        name: 'organizationName',
        value: process.env.CERT_ORGANIZATION
    }, {
        shortName: 'OU',
        value: process.env.CERT_ORGANIZATION_UNIT
    }];

    // sets the attributes above as subject and issuer
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'subjectAltName',
        altNames: [{
            type: 6, 
            value: process.env.CERT_URI
        }]
    }]);

    // self-signs the certificate
    cert.sign(keys.privateKey);

    // creates PKCS12 object
    var newPkcs12Asn1 = forge.pkcs12.toPkcs12Asn1(
        keys.privateKey, [cert], password,
        { generateLocalKeyId: true, friendlyName: 'test' });

    // converts PKCS12 object to DER 
    var newPkcs12Der = forge.asn1.toDer(newPkcs12Asn1).getBytes();
    var caStore = forge.pki.createCaStore([cert]);

    // returns the certificate buffer
    return loadPkcs12(newPkcs12Der, password, caStore);
}

/*
 * Method loads a PKCS12 object from DER and extracts the private key and certificate chain.
 * It is being used to load the certificate buffer and extract the private key and certificate chain.
*/
function loadPkcs12(pkcs12Der, password, caStore) {
    // loads PKCS12 object from DER
    var pkcs12Asn1 = forge.asn1.fromDer(pkcs12Der);
    var pkcs12 = forge.pkcs12.pkcs12FromAsn1(pkcs12Asn1, false, password);
    var map = {};

    // extracts the private key and certificate chain
    for (var sci = 0; sci < pkcs12.safeContents.length; ++sci) {
        var safeContents = pkcs12.safeContents[sci];

        for (var sbi = 0; sbi < safeContents.safeBags.length; ++sbi) {
            var safeBag = safeContents.safeBags[sbi];

            var localKeyId = null;
            if (safeBag.attributes.localKeyId) {
                localKeyId = forge.util.bytesToHex(
                    safeBag.attributes.localKeyId[0]);
                if (!(localKeyId in map)) {
                    map[localKeyId] = {
                        privateKey: null,
                        certChain: []
                    };
                }
            } else {
                continue;
            }

            if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
                map[localKeyId].privateKey = safeBag.key;
            } else if (safeBag.type === forge.pki.oids.certBag) {
                map[localKeyId].certChain.push(safeBag.cert);
            }
        }
    }

    // logs the local key ID, private key, certificate chain and chain verification
    for (var localKeyId in map) {
        var entry = map[localKeyId];
        console.log('\nLocal Key ID: ' + localKeyId);
        if (entry.privateKey) {
            var privateKeyP12Pem = forge.pki.privateKeyToPem(entry.privateKey);
            var encryptedPrivateKeyP12Pem = forge.pki.encryptRsaPrivateKey(
                entry.privateKey, password);
        }
        if (entry.certChain.length > 0) {
            var certChain = entry.certChain;
            for (var i = 0; i < certChain.length; ++i) {
                var certP12Pem = forge.pki.certificateToPem(certChain[i]);
            }

            var chainVerified = false;
            try {
                chainVerified = forge.pki.verifyCertificateChain(caStore, certChain);
            } catch (ex) {
                chainVerified = ex;
            }
        }
    }

    // return certificate buffer as instance of Buffer
    return Buffer.from(pkcs12Der, 'binary');
}

module.exports = { generateCertificate };