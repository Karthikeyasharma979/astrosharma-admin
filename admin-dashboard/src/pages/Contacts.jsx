import { useEffect, useState } from 'react';
import axios from '../utils/axios';
import { Trash2 } from 'lucide-react';
import Toast from '../components/Toast';

const Contacts = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
    };

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const { data } = await axios.get('/admin/contacts');
                setContacts(data);
            } catch (error) {
                console.error("Failed to fetch contacts", error);
            } finally {
                setLoading(false);
            }
        };

        fetchContacts();
    }, []);

    const handleDeleteContact = async (contactId) => {
        const confirmed = window.confirm('Are you sure you want to delete this inquiry?');
        if (!confirmed) return;

        setDeletingId(contactId);
        try {
            await axios.delete(`/admin/contacts/${contactId}`);
            setContacts(prev => prev.filter(contact => contact._id !== contactId));
            showToast('Inquiry deleted successfully', 'success');
        } catch (error) {
            console.error('Failed to delete contact', error);
            showToast('Failed to delete inquiry', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, visible: false }))}
            />

            <header>
                <h1 className="text-3xl font-bold text-slate-100 mb-2">Inquiries</h1>
                <p className="text-slate-400">View messages from the contact form.</p>
            </header>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50 border-b border-slate-700/50">
                                <th className="p-4 font-medium text-sm text-slate-400">User Details</th>
                                <th className="p-4 font-medium text-sm text-slate-400">Message</th>
                                <th className="p-4 font-medium text-sm text-slate-400">Status</th>
                                <th className="p-4 font-medium text-sm text-slate-400 text-right">Date Received</th>
                                <th className="p-4 font-medium text-sm text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">Loading inquiries...</td>
                                </tr>
                            ) : contacts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">No inquiries found</td>
                                </tr>
                            ) : (
                                contacts.map((contact) => (
                                    <tr key={contact._id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-slate-200">{contact.name}</div>
                                            <div className="text-sm text-slate-500">{contact.email}</div>
                                        </td>
                                        <td className="p-4 max-w-md">
                                            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{contact.message}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                contact.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                contact.status === 'In Progress' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                                {contact.status || 'New'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400 text-right">
                                            {new Date(contact.createdAt).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDeleteContact(contact._id)}
                                                disabled={deletingId === contact._id}
                                                className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <Trash2 size={14} />
                                                {deletingId === contact._id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Contacts;
