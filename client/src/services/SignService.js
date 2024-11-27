import axios from 'axios';

const endpoint = '/api/sign';

export default class SignService {
    static async create(pdfs, signatures) {
        const formData = new FormData();

        [...pdfs].forEach(pdf => {
            const blob = new Blob([pdf], { type: 'application/pdf' });
            formData.append('pdfs', blob, pdf.name);
        });
        formData.append('signatures', JSON.stringify(signatures));
        
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            responseType: 'json'
        };

        try {
            const response = await axios.post(`${endpoint}/create`, formData, config);
            return response.data;
        }
        catch (error) {
            return error.response;
        }
    }

    static async send(pdfs, email) {
        const formData = new FormData();

        [...pdfs].forEach(pdf => {
            const blob = new Blob([new Uint8Array(pdf.buffer.data)], { type: 'application/pdf' });
            formData.append('pdfs', blob, pdf.name);
        });
        formData.append('email', email);
        
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            responseType: 'json'
        };

        try {
            const response = await axios.post(`${endpoint}/send`, formData, config);
            return response.data;
        }
        catch (error) {
            return error.response;
        }
    }

    static async addCertificate(title, certificate) {
        const formData = new FormData();

        const blob = new Blob([certificate], { type: 'application/x-pkcs12' });
        formData.append('certificate', blob, 'certificate.p12');
        formData.append('title', title);

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        };

        try {
            const response = await axios.post(`${endpoint}/certificate`, formData, config);
            return response.data;
        }
        catch (error) {
            return error.response;
        }
    }
};