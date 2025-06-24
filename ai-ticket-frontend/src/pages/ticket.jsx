import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [user, setUser] = useState(null);
  const [taggedUsers, setTaggedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [targetRoles, setTargetRoles] = useState([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const currentUser = localStorage.getItem("user");
    if (currentUser) {
      setUser(JSON.parse(currentUser));
    }
  }, []);

  // Fetch moderators and admins for tagging
  useEffect(() => {
    const fetchModeratorsAndAdmins = async () => {
      if (user && (user.role === 'moderator' || user.role === 'admin')) {
        try {
          console.log("Fetching moderators and admins...");
          const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets/moderators-admins`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          console.log("Response status:", res.status);
          const data = await res.json();
          console.log("Moderators and admins data:", data);
          if (res.ok) {
            setAvailableUsers(data.users);
          } else {
            console.error("Failed to fetch moderators and admins:", data);
          }
        } catch (err) {
          console.error("Error fetching moderators and admins:", err);
        }
      }
    };

    fetchModeratorsAndAdmins();
  }, [user, token]);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/api/tickets/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const data = await res.json();
        
        if (res.ok) {
          setTicket(data.ticket);
        } else {
          console.error("Failed to fetch ticket:", data);
          alert(data.message || "Failed to fetch ticket");
        }
      } catch (err) {
        console.error("Error fetching ticket:", err);
        alert("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchTicket();
    } else {
      setLoading(false);
    }
  }, [id, token]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'badge-success';
      case 'in progress': return 'badge-warning';
      case 'closed': return 'badge-error';
      case 'resolved': return 'badge-success';
      default: return 'badge-info';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'badge-error';
      case 'medium': return 'badge-warning';
      case 'low': return 'badge-success';
      default: return 'badge-info';
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    try {
      console.log("Adding comment with tagged users:", taggedUsers);
      console.log("Adding comment with target roles:", targetRoles);
      console.log("Adding comment as private:", isPrivate);
      
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets/${id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          comment,
          taggedUsers: taggedUsers,
          targetRoles: targetRoles,
          isPrivate: isPrivate
        }),
      });

      console.log("Comment response status:", res.status);
      const responseData = await res.json();
      console.log("Comment response data:", responseData);

      if (res.ok) {
        setComment("");
        setTaggedUsers([]);
        setTargetRoles([]);
        setIsPrivate(false);
        // Refresh ticket data
        const ticketRes = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ticketData = await ticketRes.json();
        if (ticketRes.ok) {
          setTicket(ticketData.ticket);
        }
      } else {
        alert("Failed to add comment");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding comment");
    }
  };

  const handleMarkResolved = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets/${id}/resolve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        // Refresh ticket data
        const ticketRes = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/tickets/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ticketData = await ticketRes.json();
        if (ticketRes.ok) {
          setTicket(ticketData.ticket);
        }
      } else {
        alert("Failed to mark as resolved");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating ticket");
    }
  };

  const handleDownloadDetails = () => {
    const ticketData = {
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: new Date(ticket.createdAt).toLocaleString(),
      helpfulNotes: ticket.helpfulNotes,
      relatedSkills: ticket.relatedSkills,
      assignedTo: ticket.assignedTo?.email
    };

    const blob = new Blob([JSON.stringify(ticketData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTagUser = (userEmail) => {
    if (!taggedUsers.includes(userEmail)) {
      setTaggedUsers([...taggedUsers, userEmail]);
    }
    setShowTagDropdown(false);
  };

  const removeTaggedUser = (userEmail) => {
    setTaggedUsers(taggedUsers.filter(email => email !== userEmail));
  };

  const handleTargetRole = (role) => {
    if (!targetRoles.includes(role)) {
      setTargetRoles([...targetRoles, role]);
    }
    setShowRoleDropdown(false);
  };

  const removeTargetRole = (role) => {
    setTargetRoles(targetRoles.filter(r => r !== role));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTagDropdown && !event.target.closest('.tag-dropdown-container')) {
        setShowTagDropdown(false);
      }
      if (showRoleDropdown && !event.target.closest('.role-dropdown-container')) {
        setShowRoleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagDropdown, showRoleDropdown]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H2a9 9 0 0118 0v1a9 9 0 01-9 9z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket not found</h3>
          <p className="text-gray-600 mb-4">The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link to="/app" className="btn btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link to="/app" className="btn btn-outline btn-sm mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tickets
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{ticket.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(ticket.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {ticket.status && (
                <span className={`badge ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              )}
              {ticket.priority && (
                <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority} Priority
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Description
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
              </div>
            </div>

            {/* Helpful Notes */}
            {ticket.helpfulNotes && (user?.role === 'moderator' || user?.role === 'admin') && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mt-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Analysis & Notes
                </h2>
                <div className="prose max-w-none bg-green-50 rounded-lg p-4 border border-green-200 text-gray-800">
                  <ReactMarkdown>{ticket.helpfulNotes}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comments
              </h2>
              
              <div className="space-y-4 mb-4">
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((comment, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{comment.user?.email || 'Unknown'}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-800 mb-2">{comment.comment}</p>
                      {comment.taggedUsers && comment.taggedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {comment.taggedUsers.map((taggedUser, tagIndex) => (
                            <span key={tagIndex} className="badge badge-info badge-sm text-white">
                              @{taggedUser}
                            </span>
                          ))}
                        </div>
                      )}
                      {comment.targetRoles && comment.targetRoles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-xs text-gray-500">Visible to:</span>
                          {comment.targetRoles.map((role, roleIndex) => (
                            <span key={roleIndex} className="badge badge-warning badge-sm text-white">
                              {role}
                            </span>
                          ))}
                        </div>
                      )}
                      {comment.isPrivate && (
                        <div className="flex items-center gap-1 mt-2">
                          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          <span className="text-xs text-red-600 font-medium">Private Message</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No comments yet</p>
                )}
              </div>

              <div className="space-y-3">
                {/* Tagged Users Display */}
                {taggedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm text-gray-600">Tagged:</span>
                    {taggedUsers.map((userEmail, index) => (
                      <span key={index} className="badge badge-info badge-sm text-white flex items-center gap-1">
                        @{userEmail}
                        <button
                          onClick={() => removeTaggedUser(userEmail)}
                          className="ml-1 hover:text-red-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Target Roles Display */}
                {targetRoles.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="text-sm text-gray-600">Visible to:</span>
                    {targetRoles.map((role, index) => (
                      <span key={index} className="badge badge-warning badge-sm text-white flex items-center gap-1">
                        {role}
                        <button
                          onClick={() => removeTargetRole(role)}
                          className="ml-1 hover:text-red-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <div className="flex-1 relative tag-dropdown-container">
                    <input
                      id="comment-input"
                      type="text"
                      placeholder="Add a comment..."
                      className="input input-bordered w-full bg-white text-gray-900 placeholder-gray-500"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    
                    {/* Tag Button for Moderators/Admins */}
                    {(user?.role === 'moderator' || user?.role === 'admin') && availableUsers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowTagDropdown(!showTagDropdown)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-xs btn-outline"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Tag Dropdown */}
                    {showTagDropdown && (user?.role === 'moderator' || user?.role === 'admin') && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                        {availableUsers.map((user) => (
                          <button
                            key={user._id}
                            onClick={() => handleTagUser(user.email)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2"
                          >
                            <span className={`badge badge-xs ${user.role === 'admin' ? 'badge-error' : 'badge-warning'}`}>
                              {user.role}
                            </span>
                            {user.email}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleAddComment}
                    className="btn btn-primary"
                    disabled={!comment.trim()}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send
                  </button>
                </div>

                {/* Role-Based Messaging Controls for Moderators/Admins */}
                {(user?.role === 'moderator' || user?.role === 'admin') && (
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm text-gray-600">Message options:</span>
                    
                    {/* Target Roles Dropdown */}
                    <div className="relative role-dropdown-container">
                      <button
                        type="button"
                        onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                        className="btn btn-xs btn-outline"
                      >
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Target Roles
                      </button>
                      
                      {showRoleDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                          <button
                            onClick={() => handleTargetRole('user')}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2"
                          >
                            <span className="badge badge-xs badge-success">user</span>
                            Users
                          </button>
                          <button
                            onClick={() => handleTargetRole('moderator')}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2"
                          >
                            <span className="badge badge-xs badge-warning">moderator</span>
                            Moderators
                          </button>
                          <button
                            onClick={() => handleTargetRole('admin')}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm text-gray-700 flex items-center gap-2"
                          >
                            <span className="badge badge-xs badge-error">admin</span>
                            Admins
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Private Message Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="checkbox checkbox-xs"
                      />
                      <span className="text-sm text-gray-600">Private Message</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metadata Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ticket Information
              </h3>
              
              <div className="space-y-4">
                {ticket.status && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                    <span className={`badge ${getStatusColor(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                )}

                {ticket.priority && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
                    <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                )}

                {ticket.relatedSkills?.length > 0 && (user?.role === 'moderator' || user?.role === 'admin') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Related Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {ticket.relatedSkills.map((skill, index) => (
                        <span key={index} className="badge badge-outline badge-sm text-black">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {ticket.assignedTo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Assigned To</label>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm text-gray-700">{ticket.assignedTo.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  className="btn btn-outline btn-sm w-full text-black"
                  onClick={() => document.getElementById('comment-input')?.focus()}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Add Comment
                </button>
                
                {(user?.role === 'moderator' || user?.role === 'admin') && ticket.status !== 'resolved' && (
                  <button 
                    className="btn btn-success btn-sm w-full text-black"
                    onClick={handleMarkResolved}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark as Resolved
                  </button>
                )}
                
                <button 
                  className="btn btn-outline btn-sm w-full text-black"
                  onClick={handleDownloadDetails}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Download Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
