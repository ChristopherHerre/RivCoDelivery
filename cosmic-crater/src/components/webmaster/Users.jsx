import React, { useEffect, useState } from 'react';
import { MAX_RETRY_ATTEMPTS } from '../App';
import axios from 'axios';

// Material UI imports
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress, 
  Container, 
  Divider,
  Grid, 
  Slider,
  Stack, 
  TextField, 
  Typography,
  InputAdornment,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

function Users() {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");

    useEffect(() => {
        const fetchUsers = async (attempt = 1) => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/users`, {
                    params: { page, limit: 6, query },
                    withCredentials: true
                });
                console.log('Users:', res.data);
                setUsers(res.data);
            } catch (err) {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchUsers(attempt + 1);
                } else {
                    console.error('Error fetching users:', err);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [page, query]);

    function Pages() {
        return (
            <Stack 
                direction="row" 
                spacing={2} 
                justifyContent="center" 
                alignItems="center"
                sx={{ my: 3 }}
            >
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<NavigateBeforeIcon />}
                    onClick={() => setPage(prevPage => Math.max(prevPage - 1, 1))}
                    disabled={page === 1}
                    sx={{ 
                        bgcolor: '#4a6fa5',
                        '&:hover': { bgcolor: '#2e4765' }
                    }}
                >
                    Previous
                </Button>
                
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Page {page}
                </Typography>
                
                <Button
                    variant="contained"
                    color="primary"
                    endIcon={<NavigateNextIcon />}
                    onClick={() => setPage(prevPage => prevPage + 1)}
                    sx={{ 
                        bgcolor: '#4a6fa5',
                        '&:hover': { bgcolor: '#2e4765' }
                    }}
                >
                    Next
                </Button>
            </Stack>
        );
    }

    const handleRestaurantIdChange = async (event, userId) => {
        const newValue = event.target.value;
        setUsers(newUsers => newUsers.map(user => {
            if (user.id === userId) {
                return { ...user, restaurant_id: newValue };
            }
            return user;
        }));
        try {
            const response = await axios.put(`/api/users/${userId}/restaurant`, { restaurant_id: newValue }, {
                withCredentials: true
            });
            console.log('Restaurant ID updated:', response.data);
        } catch (err) {
            console.error('Error updating restaurant ID:', err);
        }
    };

    const handleSearchChange = (event) => {
        setQuery(event.target.value);
        setPage(1);
    };

    function User({ user }) {
        const [userLoading, setUserLoading] = useState(false);
        
        const handleChange = async (event, newValue) => {
            setUsers(newUsers => newUsers.map(u => {
                if (u.id === user.id) {
                    return { ...u, role: newValue };
                }
                return u;
            }));
            setUserLoading(true);
            try {
                const response = await axios.put(`/api/users/${user.id}/role`, { role: newValue }, {
                    withCredentials: true
                });
                console.log('Role updated:', response.data);
            } catch (err) {
                console.error('Error updating role:', err);
            } finally {
                setUserLoading(false);
            }
        };

        const roleMarks = [
            { value: 0, label: 'Basic' },
            { value: 1, label: 'Driver' },
            { value: 2, label: 'Restaurant' }
        ];

        return userLoading ? (
            <Grid item xs={12} md={6} lg={4}>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            </Grid>
        ) : (
            <Grid item xs={12} md={6} lg={4}>
                <Card 
                    sx={{ 
                        p: 2, 
                        mb: 3, 
                        height: '100%',
                        bgcolor: '#2e4765', 
                        color: 'white',
                        boxShadow: 3
                    }}
                >
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            {user.name}
                        </Typography>
                        
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <Box component="span" sx={{ fontWeight: 'bold' }}>Email:</Box> {user.email}
                        </Typography>
                        
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <Box component="span" sx={{ fontWeight: 'bold' }}>Address: </Box>
                            {user.address_street_number} {user.address_street}, {user.address_city}, {user.address_state} {user.address_zip}
                        </Typography>
                        
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <Box component="span" sx={{ fontWeight: 'bold' }}>Latitude: </Box>
                            {user.address_latitude}
                        </Typography>
                        
                        <Typography variant="body1" sx={{ mb: 1 }}>
                            <Box component="span" sx={{ fontWeight: 'bold' }}>Longitude: </Box>
                            {user.address_longitude}
                        </Typography>
                        
                        <Box sx={{ mb: 2, mt: 3 }}>
                            <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Role:
                            </Typography>
                            
                            <Slider
                                value={parseInt(user.role)}
                                onChange={handleChange}
                                step={1}
                                marks={roleMarks}
                                min={0}
                                max={2}
                                sx={{
                                    color: '#ff9966',
                                    '& .MuiSlider-thumb': {
                                        width: 24,
                                        height: 24,
                                    },
                                    '& .MuiSlider-markLabel': {
                                        color: 'white'
                                    }
                                }}
                            />
                            
                            <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.7)' }}>
                                Current role: <Box component="span" sx={{ fontWeight: 'bold' }}>{user.role}</Box>
                            </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body1" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Restaurant ID:
                            </Typography>
                            
                            <TextField
                                type="number"
                                fullWidth
                                defaultValue={user.restaurant_id}
                                onChange={(e) => handleRestaurantIdChange(e, user.id)}
                                variant="outlined"
                                size="small"
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        color: 'white',
                                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                                        '& fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.3)',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'rgba(255, 255, 255, 0.5)',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#ff9966',
                                        },
                                    },
                                }}
                            />
                        </Box>
                        
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            <Box component="span" sx={{ fontWeight: 'bold' }}>Created At: </Box>
                            {new Date(user.created_at).toLocaleString()}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom 
                sx={{ mb: 3, color: '#2e4765', fontWeight: 'bold' }}>
                Users List
            </Typography>
            
            <Box sx={{ mb: 4 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Search users by name or email..."
                            value={query}
                            onChange={handleSearchChange}
                            variant="outlined"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                sx: {
                                    bgcolor: '#f5f7fa'
                                }
                            }}
                        />
                    </Grid>
                </Grid>
            </Box>
            
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress sx={{ color: '#4a6fa5' }} />
                </Box>
            ) : (
                <>
                    {users?.length > 0 ? <Pages /> : ""}
                    
                    {users?.length > 0 ? (
                        <Grid container spacing={3}>
                            {users?.map(user => (
                                <User user={user} key={user.id} />
                            ))}
                        </Grid>
                    ) : (
                        <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f5f7fa' }}>
                            <Typography variant="h6">
                                No users found.
                            </Typography>
                        </Paper>
                    )}
                    
                    {users?.length > 0 ? <Pages /> : ""}
                </>
            )}
        </Container>
    );
}

export default Users;