import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../../App';
import { groupBy } from '../RestaurantsList';
import { 
    Typography, 
    Container, 
    Box, 
    Card, 
    CardContent, 
    Grid, 
    Button, 
    CircularProgress,
    Chip,
    Divider
} from '@mui/material';
import { 
    ArrowBack as ArrowBackIcon,
    RestaurantMenu as RestaurantMenuIcon,
    ShoppingCart as ShoppingCartIcon 
} from '@mui/icons-material';

export default function Menu(props) {
    const restaurant = props.restaurant;
    const menuItem = props.menuItem;
    const setMenuItem = props.setMenuItem;
    const restaurantName = props.restaurantName;
    const [menu, setMenu] = useState([]);
    const navigate = useNavigate();
    const result = groupBy(menu, r => r.category);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const fetchMenu = async (attempt = 1) => {
            if (props.restaurant < 0) navigate("/");
            try {
                const res = await axios.get(`/api/restaurants2/${restaurant}/menu`);
                console.log(res.data);
                setMenu(res.data);
                setLoaded(true);
            } catch (err) {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchMenu(attempt + 1);
                } else {
                    console.error('Error fetching menu:', err);
                   // window.location.href = '/404-page.html';
                }
            }
        };

        fetchMenu();
    }, [restaurant, navigate]);

    function changeMenuItem(m) {
        setMenuItem(m.id);
        console.log("menu = " + menuItem);
    }

    let lastCategory = "";
    function setLastCategoryPrinted(v) {
        lastCategory = v;
    }

    return (
        <Box sx={{ 
            background: 'linear-gradient(to bottom, #f5f7fa, #eef1f5)',
            minHeight: '100vh',
            py: 3
        }}>
            <Container>
                <Box sx={{ mb: 4 }}>
                    <Link to="/" style={{ textDecoration: 'none' }}>
                        <Button 
                            startIcon={<ArrowBackIcon />} 
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                borderColor: '#4a6fa5',
                                color: '#4a6fa5',
                                '&:hover': {
                                    borderColor: '#2e4765',
                                    backgroundColor: 'rgba(74, 111, 165, 0.04)'
                                },
                                mb: 2
                            }}
                        >
                            Back to Restaurants
                        </Button>
                    </Link>
                    
                    <Typography 
                        variant="h4" 
                        component="h1"
                        sx={{ 
                            fontWeight: 700,
                            color: '#2e4765',
                            mb: 1
                        }}
                    >
                        {restaurantName}
                    </Typography>
                    
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mb: 3
                    }}>
                        <RestaurantMenuIcon sx={{ color: '#4a6fa5', mr: 1 }} />
                        <Typography 
                            variant="body1"
                            sx={{ 
                                color: '#4a6fa5',
                                fontWeight: 500
                            }}
                        >
                            Menu
                        </Typography>
                    </Box>
                </Box>

                {!loaded ? (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        flexDirection: 'column',
                        py: 8
                    }}>
                        <CircularProgress sx={{ color: '#4a6fa5', mb: 3 }} />
                        <Typography variant="h6" sx={{ color: '#4a6fa5' }}>
                            Loading menu...
                        </Typography>
                    </Box>
                ) : (
                    Object.keys(result).map((category, categoryIndex) => {
                        setLastCategoryPrinted(category);
                        return (
                            <Box key={categoryIndex} sx={{ mb: 5 }}>
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        ml: 1,
                                        mb: 2, 
                                        fontWeight: 700,
                                        color: '#2e4765',
                                        position: 'relative',
                                        display: 'inline-block',
                                        pb: 1,
                                        '&:after': {
                                            content: '""',
                                            position: 'absolute',
                                            width: '60%',
                                            height: '4px',
                                            bottom: 0,
                                            left: 0,
                                            backgroundColor: '#ff9966',
                                            borderRadius: '2px'
                                        }
                                    }}
                                >
                                    {category}
                                </Typography>
                                
                                <Grid container spacing={3}>
                                    {result[category].map((item, index) => (
                                        <Grid item xs={12} sm={6} md={4} key={index}>
                                            <Link 
                                                to={`/menu/item/`}
                                                style={{ textDecoration: 'none' }}
                                                onClick={(e) => changeMenuItem(item)}
                                            >
                                                <Card 
                                                    sx={{ 
                                                        height: '100%',
                                                        borderRadius: 3,
                                                        overflow: 'hidden',
                                                        transition: 'all 0.3s ease-in-out',
                                                        border: '1px solid #e0e0e0',
                                                        position: 'relative',
                                                        '&:hover': {
                                                            transform: 'translateY(-8px)',
                                                            boxShadow: '0 12px 20px rgba(0,0,0,0.15)',
                                                            '& .price-chip': {
                                                                backgroundColor: '#ff9966',
                                                                color: 'white'
                                                            }
                                                        },
                                                        '&:before': {
                                                            content: '""',
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '6px',
                                                            height: '100%',
                                                            backgroundColor: '#4a6fa5',
                                                        }
                                                    }}
                                                >
                                                    <CardContent sx={{ p: 3 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                            <Typography 
                                                                variant="h6" 
                                                                component="div"
                                                                sx={{ 
                                                                    fontWeight: 'bold',
                                                                    color: '#2e4765',
                                                                    flexGrow: 1,
                                                                    pr: 2
                                                                }}
                                                            >
                                                                {item.name}
                                                            </Typography>
                                                            
                                                            <Chip
                                                                label={typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : `$${parseFloat(item.price || 0).toFixed(2)}`}
                                                                className="price-chip"
                                                                sx={{ 
                                                                    backgroundColor: '#e9eef6',
                                                                    color: '#4a6fa5',
                                                                    fontWeight: 'bold',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                            />
                                                        </Box>
                                                        
                                                        <Typography 
                                                            variant="body2"
                                                            sx={{
                                                                color: '#666',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 3,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                mb: 2,
                                                                height: '60px'
                                                            }}
                                                        >
                                                            {item.description}
                                                        </Typography>
                                                        
                                                        <Box 
                                                            sx={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center',
                                                                mt: 'auto'
                                                            }}
                                                        >
                                                            <ShoppingCartIcon sx={{ fontSize: '1rem', color: '#ff9966', mr: 1 }} />
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    color: '#4a6fa5',
                                                                    fontWeight: 500
                                                                }}
                                                            >
                                                                Add to cart
                                                            </Typography>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        );
                    })
                )}
            </Container>
        </Box>
    );
}