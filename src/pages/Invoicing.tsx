import React from 'react';
import { useLocation } from 'react-router-dom';
import InvoiceGenerator from '../components/Calculator/InvoiceGenerator';

const InvoicingPage = () => {
    const location = useLocation();
    const initialData = location.state?.invoiceData;

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <InvoiceGenerator initialData={initialData} />
        </div>
    );
};

export default InvoicingPage;
