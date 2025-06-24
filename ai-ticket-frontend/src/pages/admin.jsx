import { useEffect, useState } from "react";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ role: "", skills: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: "",
    password: "",
    role: "user",
    skills: ""
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/auth/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
        setFilteredUsers(data);
      } else {
        setError(data.error || "Failed to fetch users");
        console.error(data.error);
      }
    } catch (err) {
      setError("Network error while fetching users");
      console.error("Error fetching users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user.email);
    setFormData({
      role: user.role || "user",
      skills: user.skills?.join(", ") || "",
    });
  };

  const handleUpdate = async () => {
    try {
      setError("");
      setSuccess("");
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/update-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: editingUser,
            role: formData.role,
            skills: formData.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean),
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setSuccess("User updated successfully!");
        setEditingUser(null);
        setFormData({ role: "", skills: "" });
        fetchUsers(); // Refresh the list
      } else {
        setError(data.error || "Failed to update user");
        console.error(data.error);
      }
    } catch (err) {
      setError("Network error while updating user");
      console.error("Update failed", err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setError("");
      setSuccess("");
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: createFormData.email,
            password: createFormData.password,
            role: createFormData.role,
            skills: createFormData.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean),
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setSuccess("User created successfully!");
        setShowCreateForm(false);
        setCreateFormData({
          email: "",
          password: "",
          role: "user",
          skills: ""
        });
        fetchUsers(); // Refresh the list
      } else {
        setError(data.error || "Failed to create user");
        console.error(data.error);
      }
    } catch (err) {
      setError("Network error while creating user");
      console.error("Create failed", err);
    }
  };

  const handleDeleteUser = async (userEmail) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}?`)) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/auth/delete-user`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: userEmail }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setSuccess("User deleted successfully!");
        fetchUsers(); // Refresh the list
      } else {
        setError(data.error || "Failed to delete user");
      }
    } catch (err) {
      setError("Network error while deleting user");
      console.error("Delete failed", err);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredUsers(
      users.filter((user) => user.email.toLowerCase().includes(query))
    );
  };

  const handleFilterByRole = (role) => {
    if (role === "all") {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.role === role));
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'badge-error';
      case 'moderator': return 'badge-warning';
      case 'user': return 'badge-success';
      default: return 'badge-info';
    }
  };

  const getRoleStats = () => {
    const stats = {
      total: users.length,
      admin: users.filter(u => u.role === 'admin').length,
      moderator: users.filter(u => u.role === 'moderator').length,
      user: users.filter(u => u.role === 'user').length
    };
    return stats;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  const stats = getRoleStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-gray-600">Manage users and system settings</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="btn btn-primary btn-lg shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {showCreateForm ? 'Cancel' : 'Create User'}
            </button>
          </div>
        </div>

        {/* Create User Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="create-email"
                    type="email"
                    required
                    className="input input-bordered w-full bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Enter email address"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                  />
                </div>
                
                <div>
                  <label htmlFor="create-password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="create-password"
                    type="password"
                    required
                    className="input input-bordered w-full bg-white text-gray-900 placeholder-gray-500"
                    placeholder="Enter password"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="create-role"
                    className="select select-bordered w-full bg-white text-gray-900"
                    value={createFormData.role}
                    onChange={(e) => setCreateFormData({...createFormData, role: e.target.value})}
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="create-skills" className="block text-sm font-medium text-gray-700 mb-2">
                    Skills (comma-separated)
                  </label>
                  <input
                    id="create-skills"
                    type="text"
                    className="input input-bordered w-full bg-white text-gray-900 placeholder-gray-500"
                    placeholder="e.g., JavaScript, React, Node.js"
                    value={createFormData.skills}
                    onChange={(e) => setCreateFormData({...createFormData, skills: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  className="btn btn-primary flex-1" 
                  type="submit"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create User
                </button>
                <button 
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="alert alert-error mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError("")} className="btn btn-sm btn-ghost">×</button>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="btn btn-sm btn-ghost">×</button>
          </div>
        )}

        {/* Search and Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="search"
                  type="text"
                  className="input input-bordered w-full pl-10 bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search by email address..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.admin}</div>
                <div className="text-sm text-gray-600">Admins</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.moderator}</div>
                <div className="text-sm text-gray-600">Moderators</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.user}</div>
                <div className="text-sm text-gray-600">Users</div>
              </div>
            </div>
          </div>

          {/* Role Filter */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button 
              onClick={() => handleFilterByRole("all")}
              className="btn btn-sm btn-outline"
            >
              All ({stats.total})
            </button>
            <button 
              onClick={() => handleFilterByRole("admin")}
              className="btn btn-sm btn-outline btn-error"
            >
              Admins ({stats.admin})
            </button>
            <button 
              onClick={() => handleFilterByRole("moderator")}
              className="btn btn-sm btn-outline btn-warning"
            >
              Moderators ({stats.moderator})
            </button>
            <button 
              onClick={() => handleFilterByRole("user")}
              className="btn btn-sm btn-outline btn-success"
            >
              Users ({stats.user})
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
            <p className="text-gray-600 mt-1">Showing {filteredUsers.length} of {users.length} users</p>
          </div>
          
          <div className="p-6">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or filters.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user._id}
                    className="bg-gray-50 rounded-lg p-6 border border-gray-200 hover:border-blue-300 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{user.email}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`badge ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                              <span className="text-xs text-gray-500">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {user.skills && user.skills.length > 0 && (
                          <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">Skills</label>
                            <div className="flex flex-wrap gap-2">
                              {user.skills.map((skill, index) => (
                                <span key={index} className="badge badge-outline badge-sm">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex gap-2">
                        {editingUser === user.email ? (
                          <div className="space-y-3 min-w-[300px]">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                              <select
                                className="select select-bordered w-full bg-white text-gray-900"
                                value={formData.role}
                                onChange={(e) =>
                                  setFormData({ ...formData, role: e.target.value })
                                }
                              >
                                <option value="user">User</option>
                                <option value="moderator">Moderator</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                              <input
                                type="text"
                                placeholder="Comma-separated skills"
                                className="input input-bordered w-full bg-white text-gray-900 placeholder-gray-500"
                                value={formData.skills}
                                onChange={(e) =>
                                  setFormData({ ...formData, skills: e.target.value })
                                }
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                className="btn btn-success btn-sm flex-1"
                                onClick={handleUpdate}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setEditingUser(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleEditClick(user)}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                className="btn btn-error btn-sm"
                                onClick={() => handleDeleteUser(user.email)}
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
