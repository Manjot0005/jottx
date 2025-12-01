import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  TablePagination,
  CircularProgress,
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  InputAdornment,
  Alert,
  Snackbar,
  Avatar,
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Search,
  Person,
  Email,
  Phone,
  LocationOn,
  Close,
  PersonAdd,
  Refresh,
} from '@mui/icons-material';
import { usersStore, bookingsStore } from '../services/sharedData';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
    city: '',
    state: '',
    zip_code: '',
    is_active: true,
  });
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchUsers();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    try {
      // Get users from shared store (includes travelers from port 3001)
      const allUsers = usersStore.getAll();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      showSnackbar('Error fetching users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (user.first_name || '').toLowerCase().includes(query) ||
      (user.last_name || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      (user.phone_number || '').includes(query) ||
      (user.city || '').toLowerCase().includes(query)
    );
  });

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Create User
  const handleOpenCreateDialog = () => {
    const randomSSN = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({
      user_id: randomSSN,
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      phone_number: '',
      city: '',
      state: '',
      zip_code: '',
      is_active: true,
    });
    setCreateDialogOpen(true);
  };

  const handleCreateUser = () => {
    try {
      usersStore.add({
        ...formData,
        user_id: formData.user_id || `USR-${Date.now()}`,
      });
      setCreateDialogOpen(false);
      showSnackbar('User created successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      showSnackbar(error.message || 'Error creating user', 'error');
    }
  };

  // Edit User
  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      user_id: user.user_id || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      password: '',
      phone_number: user.phone_number || user.phone || '',
      city: user.city || '',
      state: user.state || '',
      zip_code: user.zip_code || '',
      is_active: user.is_active ?? true,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    try {
      usersStore.update(selectedUser.user_id, formData);
      setEditDialogOpen(false);
      showSnackbar('User updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      showSnackbar(error.message || 'Error updating user', 'error');
    }
  };

  // View User
  const handleOpenViewDialog = (user) => {
    setSelectedUser(user);
    // Get user's bookings
    const bookings = bookingsStore.getByUser(user.user_id);
    setUserBookings(bookings);
    setViewDialogOpen(true);
  };

  // Delete User
  const handleDelete = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        usersStore.delete(userId);
        showSnackbar('User deleted successfully');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        showSnackbar('Failed to delete user', 'error');
      }
    }
  };

  const handleFormChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
  };

  // User Form Component
  const UserForm = ({ isEdit = false }) => (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="User ID (SSN Format: XXX-XX-XXXX)"
          value={formData.user_id}
          onChange={handleFormChange('user_id')}
          required
          disabled={isEdit}
          helperText="Format: 123-45-6789"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="First Name"
          value={formData.first_name}
          onChange={handleFormChange('first_name')}
          required
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Last Name"
          value={formData.last_name}
          onChange={handleFormChange('last_name')}
          required
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleFormChange('email')}
          required
          disabled={isEdit}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label={isEdit ? "New Password (leave empty to keep current)" : "Password"}
          type="password"
          value={formData.password}
          onChange={handleFormChange('password')}
          required={!isEdit}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Phone Number (10 digits)"
          value={formData.phone_number}
          onChange={handleFormChange('phone_number')}
          helperText="e.g., 5551234567"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.is_active}
            label="Status"
            onChange={(e) => setFormData({ ...formData, is_active: e.target.value })}
          >
            <MenuItem value={true}>Active</MenuItem>
            <MenuItem value={false}>Inactive</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="City"
          value={formData.city}
          onChange={handleFormChange('city')}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="State (2-letter)"
          value={formData.state}
          onChange={handleFormChange('state')}
          helperText="e.g., CA, NY"
          inputProps={{ maxLength: 2 }}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="ZIP Code"
          value={formData.zip_code}
          onChange={handleFormChange('zip_code')}
          helperText="Format: 12345 or 12345-6789"
        />
      </Grid>
    </Grid>
  );

  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          User Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUsers}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={handleOpenCreateDialog}
            sx={{ borderRadius: 2 }}
          >
            Add User
          </Button>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Showing {filteredUsers.length} users including travelers registered on the booking site (port 3001)
      </Alert>

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search users by name, email, phone, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          variant="outlined"
          size="small"
        />
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 600 }}>User ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    No users found. Users who register on the traveler site will appear here!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user, index) => (
                <TableRow key={user.user_id || index} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {user.user_id || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {user.first_name?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                      {user.first_name} {user.last_name}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.city || 'N/A'}</TableCell>
                  <TableCell>{user.phone_number || user.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active !== false ? 'Active' : 'Inactive'}
                      color={user.is_active !== false ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => handleOpenViewDialog(user)}
                      title="View"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      color="info"
                      size="small"
                      onClick={() => handleOpenEditDialog(user)}
                      title="Edit"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(user.user_id)}
                      title="Delete"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAdd color="primary" />
            Create New User
          </Box>
          <IconButton onClick={() => setCreateDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <UserForm />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser}>
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit color="primary" />
            Edit User
          </Box>
          <IconButton onClick={() => setEditDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <UserForm isEdit />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateUser}>
            Update User
          </Button>
        </DialogActions>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person color="primary" />
            User Details
          </Box>
          <IconButton onClick={() => setViewDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: 24 }}>
                        {selectedUser.first_name?.charAt(0)?.toUpperCase() || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {selectedUser.first_name} {selectedUser.last_name}
                        </Typography>
                        <Chip
                          label={selectedUser.is_active !== false ? 'Active' : 'Inactive'}
                          color={selectedUser.is_active !== false ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Email color="action" fontSize="small" />
                      <Typography>{selectedUser.email}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Phone color="action" fontSize="small" />
                      <Typography>{selectedUser.phone_number || selectedUser.phone || 'Not provided'}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOn color="action" fontSize="small" />
                      <Typography>
                        {[selectedUser.city, selectedUser.state, selectedUser.zip_code]
                          .filter(Boolean)
                          .join(', ') || 'Not provided'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Booking History</Typography>
                    {userBookings.length > 0 ? (
                      userBookings.slice(0, 5).map((booking, idx) => (
                        <Box key={idx} sx={{ mb: 2, pb: 1, borderBottom: '1px solid #eee' }}>
                          <Typography variant="body2" fontWeight={500}>
                            {booking.name || booking.confirmationNumber}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {booking.type || booking.booking_type} • ${booking.totalPrice || booking.total_price}
                          </Typography>
                        </Box>
                      ))
                    ) : (
                      <Typography color="textSecondary">No bookings yet</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          <Button 
            variant="outlined" 
            onClick={() => {
              setViewDialogOpen(false);
              handleOpenEditDialog(selectedUser);
            }}
          >
            Edit User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Users;
