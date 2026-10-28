import { useState, useEffect, useContext, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

/* ─── Icons ─── */
const ChatIcon = () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
);

const SendIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
);

const MapPinIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
);

const Messages = () => {
    const { user } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const openConvoId = searchParams.get('thread');

    const [conversations, setConversations] = useState([]);
    const [activeConvo, setActiveConvo] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const isOwnerSide = user && (user.role === 'owner' || user.role === 'admin');

    // Load conversations
    useEffect(() => {
        if (!user) return;
        const fetchConversations = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/conversations');
                setConversations(res.data);
                // Auto-open thread if param provided
                if (openConvoId) {
                    const target = res.data.find(c => c._id === openConvoId);
                    if (target) setActiveConvo(target);
                }
            } catch (err) {
                console.error('Error fetching conversations:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, [user, openConvoId]);

    // Load messages when conversation selected
    useEffect(() => {
        if (!activeConvo) return;
        const fetchMessages = async () => {
            setLoadingMsgs(true);
            try {
                const res = await axios.get(`http://localhost:5000/api/conversations/${activeConvo._id}/messages`);
                setMessages(res.data);
                // Mark as read
                await axios.patch(`http://localhost:5000/api/conversations/${activeConvo._id}/read`);
                // Update local unread counter
                setConversations(prev =>
                    prev.map(c =>
                        c._id === activeConvo._id
                            ? { ...c, [isOwnerSide ? 'unreadOwner' : 'unreadTenant']: 0 }
                            : c
                    )
                );
            } catch (err) {
                console.error('Error fetching messages:', err);
            } finally {
                setLoadingMsgs(false);
            }
        };
        fetchMessages();
    }, [activeConvo?._id]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConvo) return;
        setSending(true);
        try {
            const res = await axios.post(
                `http://localhost:5000/api/conversations/${activeConvo._id}/messages`,
                { message: newMessage.trim() }
            );
            setMessages(prev => [...prev, res.data]);
            setNewMessage('');
            // Update last message preview in list
            setConversations(prev =>
                prev.map(c =>
                    c._id === activeConvo._id
                        ? {
                            ...c,
                            lastMessage: { body: newMessage.trim(), sender: user._id, date: new Date().toISOString() },
                            updatedAt: new Date().toISOString()
                        }
                        : c
                ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            );
            textareaRef.current?.focus();
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getOtherUser = (convo) => {
        return isOwnerSide ? convo.tenant : convo.owner;
    };

    const getUnread = (convo) => {
        return isOwnerSide ? convo.unreadOwner : convo.unreadTenant;
    };

    if (!user) {
        return (
            <div className="container">
                <div className="msg-page-empty">
                    <ChatIcon />
                    <h2>Sign in to view messages</h2>
                    <p>You need to be logged in to access your conversations.</p>
                    <Link to="/login" className="btn btn-primary">Sign in</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <div className="messaging-page">
                {/* ─── Sidebar: Conversation List ─── */}
                <div className={`msg-sidebar ${activeConvo ? 'msg-sidebar--hidden-mobile' : ''}`}>
                    <div className="msg-sidebar-header">
                        <h1 className="msg-sidebar-title">
                            {isOwnerSide ? 'Inbox' : 'My Messages'}
                        </h1>
                        {conversations.length > 0 && (
                            <span className="msg-sidebar-count">{conversations.length}</span>
                        )}
                    </div>

                    {loading ? (
                        <div className="msg-sidebar-loading">Loading conversations…</div>
                    ) : conversations.length === 0 ? (
                        <div className="msg-sidebar-empty">
                            <ChatIcon />
                            <p>No conversations yet</p>
                            <span className="msg-sidebar-empty-sub">
                                {isOwnerSide
                                    ? 'Tenant inquiries will appear here'
                                    : 'Contact a property owner to start a conversation'}
                            </span>
                        </div>
                    ) : (
                        <div className="msg-convo-list">
                            {conversations.map(convo => {
                                const other = getOtherUser(convo);
                                const unread = getUnread(convo);
                                const isActive = activeConvo?._id === convo._id;

                                return (
                                    <button
                                        key={convo._id}
                                        type="button"
                                        className={`msg-convo-item ${isActive ? 'msg-convo-item--active' : ''} ${unread > 0 ? 'msg-convo-item--unread' : ''}`}
                                        onClick={() => setActiveConvo(convo)}
                                    >
                                        <div className="msg-convo-avatar" aria-hidden="true">
                                            {(other?.name || 'U')[0].toUpperCase()}
                                        </div>
                                        <div className="msg-convo-body">
                                            <div className="msg-convo-top-row">
                                                <span className="msg-convo-name">{other?.name || 'User'}</span>
                                                <span className="msg-convo-time">
                                                    {convo.lastMessage?.date ? formatTime(convo.lastMessage.date) : ''}
                                                </span>
                                            </div>
                                            <div className="msg-convo-property-name">
                                                {convo.property?.title || 'Listing'}
                                            </div>
                                            <div className="msg-convo-preview-row">
                                                <span className="msg-convo-preview">
                                                    {convo.lastMessage?.body
                                                        ? convo.lastMessage.body.length > 60
                                                            ? convo.lastMessage.body.substring(0, 60) + '…'
                                                            : convo.lastMessage.body
                                                        : 'No messages yet'}
                                                </span>
                                                {unread > 0 && (
                                                    <span className="msg-convo-unread-badge">{unread}</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ─── Main: Thread View ─── */}
                <div className={`msg-thread ${!activeConvo ? 'msg-thread--hidden-mobile' : ''}`}>
                    {!activeConvo ? (
                        <div className="msg-thread-empty">
                            <ChatIcon />
                            <h3>Select a conversation</h3>
                            <p>Choose a thread from the sidebar to view messages</p>
                        </div>
                    ) : (
                        <>
                            {/* Thread Header */}
                            <div className="msg-thread-header">
                                <button
                                    type="button"
                                    className="msg-back-btn"
                                    onClick={() => setActiveConvo(null)}
                                    aria-label="Back to conversations"
                                >
                                    <ArrowLeftIcon />
                                </button>
                                <div className="msg-thread-header-info">
                                    <div className="msg-thread-avatar" aria-hidden="true">
                                        {(getOtherUser(activeConvo)?.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="msg-thread-user-name">
                                            {getOtherUser(activeConvo)?.name || 'User'}
                                        </h2>
                                        <Link
                                            to={`/properties/${activeConvo.property?._id}`}
                                            className="msg-thread-property-link"
                                        >
                                            <MapPinIcon />
                                            {activeConvo.property?.title || 'Listing'}
                                            {activeConvo.property?.city ? ` · ${activeConvo.property.city}` : ''}
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="msg-thread-body">
                                {loadingMsgs ? (
                                    <div className="msg-loading">Loading messages…</div>
                                ) : (
                                    <>
                                        {/* Property context card */}
                                        <div className="msg-context-card">
                                            {activeConvo.property?.images?.[0] && (
                                                <img
                                                    src={activeConvo.property.images[0]}
                                                    alt=""
                                                    className="msg-context-img"
                                                />
                                            )}
                                            <div className="msg-context-info">
                                                <span className="msg-context-label">Conversation about</span>
                                                <Link
                                                    to={`/properties/${activeConvo.property?._id}`}
                                                    className="msg-context-title"
                                                >
                                                    {activeConvo.property?.title || 'Property'}
                                                </Link>
                                                {activeConvo.property?.city && (
                                                    <span className="msg-context-city">
                                                        <MapPinIcon /> {activeConvo.property.city}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {messages.map((msg, idx) => {
                                            const isMine = msg.sender?._id === user._id;
                                            const showAvatar = idx === 0 || messages[idx - 1]?.sender?._id !== msg.sender?._id;

                                            return (
                                                <div
                                                    key={msg._id}
                                                    className={`msg-bubble-wrap ${isMine ? 'msg-bubble-wrap--mine' : 'msg-bubble-wrap--theirs'}`}
                                                >
                                                    {!isMine && showAvatar && (
                                                        <div className="msg-bubble-avatar" aria-hidden="true">
                                                            {(msg.sender?.name || 'U')[0].toUpperCase()}
                                                        </div>
                                                    )}
                                                    {!isMine && !showAvatar && <div className="msg-bubble-avatar-spacer" />}
                                                    <div className={`msg-bubble ${isMine ? 'msg-bubble--mine' : 'msg-bubble--theirs'}`}>
                                                        {showAvatar && (
                                                            <span className="msg-bubble-sender">
                                                                {isMine ? 'You' : msg.sender?.name}
                                                            </span>
                                                        )}
                                                        <p className="msg-bubble-text">{msg.body}</p>
                                                        <span className="msg-bubble-time">
                                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            {/* Compose */}
                            <form className="msg-compose" onSubmit={handleSend}>
                                <textarea
                                    ref={textareaRef}
                                    className="msg-compose-input"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message…"
                                    rows={1}
                                />
                                <button
                                    type="submit"
                                    className="msg-compose-send"
                                    disabled={sending || !newMessage.trim()}
                                    aria-label="Send message"
                                >
                                    <SendIcon />
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
