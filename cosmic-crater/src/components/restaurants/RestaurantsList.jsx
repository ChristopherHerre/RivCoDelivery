import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { MAX_RETRY_ATTEMPTS } from '../App';
import Spinner from '../users/Spinner';
import Welcome from '../users/address/Welcome';
import {
    TextField,
    Button,
    Card,
    CardContent,
    Typography,
    Container,
    Grid,
    Box,
    CircularProgress
} from '@mui/material';
import { Search as SearchIcon, ArrowBack as ArrowBackIcon, LocalTaxi as TaxiIcon } from '@mui/icons-material';

export function groupBy(array, keyFn) {
    return array.reduce((acc, item) => {
        const key = keyFn(item);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
}

export default function RestaurantsList(props) {
    const USDollar = props.USDollar;
    const debug = props.debug;
    const roundedToFixed = props.roundedToFixed;
    const setDeliveryFee = props.setDeliveryFee;
    const setRestaurant = props.setRestaurant;
    const setRestaurantName = props.setRestaurantName;
    const setRestaurantAddress = props.setRestaurantAddress;
    const address = props.address;
    const setAddress = props.setAddress;
    const setDistance = props.setDistance;
    const showGetLocation = props.showGetLocation;
    const setShowGetLocation = props.setShowGetLocation;
    const latitude = props.latitude;
    const setLatitude = props.setLatitude;
    const longitude = props.longitude;
    const setLongitude = props.setLongitude;
    const [restaurants, setRestaurants] = useState([]);
    const [restaurantsCopy, setRestaurantsCopy] = useState([]);
    const [itemConfig, setItemConfig] = useState([]);
    const [query, setQuery] = useState("");
    const result = groupBy(restaurants, r => r.category);
    const [loaded, setLoaded] = useState(false);
    const [loadingApiKey, setLoadingApiKey] = useState(false);
    useEffect(() => {
        const fetchAddress = async () => {
            try {
                const res = await axios.get(`/api/user/address`, {
                    withCredentials: true
                });
                setAddress(res.data.address);
                setLatitude(res.data.latitude);
                setLongitude(res.data.longitude);
                if (res.data.address && res.data.address.streetNumber) {
                    setShowGetLocation(false);
                }
            } catch (err) {
                console.error('Error fetching address:', err);
            }
        };
        if (!showGetLocation) {
            fetchAddress();
        }
    }, [showGetLocation]);
    useEffect(() => {
        const fetchRestaurants = async (attempt = 1) => {
            try {
                const url = `/api/restaurants/${latitude}/${longitude}`;
                const res = await axios.get(url);
                const restaurants = res.data.map(r => r);
                setRestaurants(restaurants);
                setRestaurantsCopy(restaurants);
                setLoaded(true);
            } catch (error) {
                console.error('Error fetching restaurants:', error);
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchRestaurants(attempt + 1);
                }
            }
        };
        if (latitude && longitude)
        {
            fetchRestaurants();
        }
    }, [latitude, longitude, setRestaurants]);

    function handleSearch(e) {
        let val = e.target.value;
        setQuery(val);
        if (val.length === 0) {
            // Reset to the original list when the search string is empty
            setRestaurants(restaurantsCopy);
            return;
        }
        axios.get('/api/menu/item/search', { params: { menuItemName: val } })
            .then(res => {
                setItemConfig(res.data);
                setRestaurants(
                    res.data.length <= 0
                        ? restaurantsCopy
                        : restaurantsCopy.filter((r) => {
                            return res.data.find(x => x.restaurant_id === r.id);
                        })
                );
            }
        );
    }
    const restaurantData = [];
    function populateRestaurantData() {
        for (const j in result) {
            for (const i in result[j]) {
                restaurantData.push(result[j][i]);
            }
        }
    }
    populateRestaurantData();
    restaurantData.sort((a, b) => {
        const distanceA = haversine_dist(
            a.latitude, 
            a.longitude, 
            latitude, 
            longitude
        );
        const distanceB = haversine_dist(
            b.latitude, 
            b.longitude, 
            latitude, 
            longitude
        );
        return distanceA - distanceB;
    });
    return (
        <Box sx={{ 
            background: 'linear-gradient(to bottom, #f5f7fa, #eef1f5)',
            minHeight: '100vh',
            py: 3
        }}>
            <Container>
                {loadingApiKey && 
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress sx={{ color: '#ff6b6b' }} />
                    </Box>
                }
                
                <Box sx={{ 
                    mb: 4, 
                    p: 3, 
                    borderRadius: 2, 
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    background: 'white'
                }}>
                    <Welcome
                        address={address}
                        setAddress={setAddress}
                        showGetLocation={showGetLocation}
                        setShowGetLocation={setShowGetLocation}
                        setLoadingApiKey={setLoadingApiKey}
                    />
                </Box>
                
                {!showGetLocation && loaded && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={7}>
                            <TextField
                                fullWidth
                                placeholder="Search for restaurants..."
                                value={query}
                                onChange={handleSearch}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: <SearchIcon sx={{ color: '#4a6fa5', mr: 1 }} />,
                                }}
                                sx={{ 
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: '#c5d1e5',
                                            borderWidth: 2,
                                        },
                                        '&:hover fieldset': {
                                            borderColor: '#4a6fa5',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#4a6fa5',
                                        },
                                        backgroundColor: 'white',
                                        borderRadius: 2,
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: '14px 14px 14px 0',
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Link to="/taxi" style={{ textDecoration: 'none' }}>
                                <Button 
                                    variant="contained" 
                                    fullWidth
                                    startIcon={<TaxiIcon />}
                                    sx={{
                                        backgroundColor: '#ff9966',
                                        py: 1.5,
                                        boxShadow: '0 4px 8px rgba(255, 153, 102, 0.4)',
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        '&:hover': {
                                            backgroundColor: '#ff8846',
                                            boxShadow: '0 6px 12px rgba(255, 153, 102, 0.6)',
                                        }
                                    }}
                                >
                                    Get a Taxi Ride
                                </Button>
                            </Link>
                        </Grid>
                    </Grid>
                )}
    
                {!showGetLocation && loaded ? (
                    Object.keys(result).map((category, categoryIndex) => (
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
                                {result[category].map((data, key) => {
                                    const h = haversine_dist(
                                        data.latitude,
                                        data.longitude,
                                        latitude,
                                        longitude
                                    );
                                    const fee = 10 + (h < 1 ? 1 : h);
                                    const maxFee = 100;
    
                                    function selectRestaurant(data) {
                                        setRestaurantName(data.name);
                                        setRestaurant(data.id);
                                        setRestaurantAddress(data.address);
                                        setDeliveryFee(fee);
                                        setDistance(h);
                                    }
    
                                    return (
                                        <Grid item xs={12} sm={6} lg={4} key={key}>
                                            <Link 
                                                to="/menu" 
                                                style={{ textDecoration: 'none' }}
                                                onClick={() => selectRestaurant(data)}
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
                                                            '& .distance-chip': {
                                                                backgroundColor: '#4a6fa5',
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
                                                        <Typography 
                                                            variant="h6" 
                                                            component="div"
                                                            sx={{ 
                                                                fontWeight: 'bold',
                                                                color: '#2e4765',
                                                                mb: 1
                                                            }}
                                                        >
                                                            {data.name}
                                                        </Typography>
                                                        
                                                        <Box 
                                                            sx={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center',
                                                                mb: 2
                                                            }}
                                                        >
                                                            <Box 
                                                                className="distance-chip"
                                                                sx={{ 
                                                                    display: 'inline-flex',
                                                                    borderRadius: '50px',
                                                                    backgroundColor: '#e9eef6',
                                                                    color: '#4a6fa5',
                                                                    px: 1.5,
                                                                    py: 0.5,
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 'bold',
                                                                    mr: 1,
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                            >
                                                                {h < 100 ? `${roundedToFixed(h, 1)} mi` : "--"}
                                                            </Box>
                                                            
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    color: '#ff6b6b',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            >
                                                                {fee > maxFee ? "--" : USDollar.format(roundedToFixed(fee, 2))} Delivery
                                                            </Typography>
                                                        </Box>
                                                        
                                                        <Typography 
                                                            variant="body2"
                                                            sx={{
                                                                color: '#666',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}
                                                        >
                                                            {data.address}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Link>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    ))
                ) : (
                    !showGetLocation && 
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        flexDirection: 'column',
                        py: 8
                    }}>
                        <CircularProgress sx={{ color: '#4a6fa5', mb: 3 }} />
                        <Typography variant="h6" sx={{ color: '#4a6fa5' }}>
                            Loading restaurants...
                        </Typography>
                    </Box>
                )}
            </Container>
        </Box>
    );
}

export function haversine_dist(lat, lng, lat2, lng2) {
    var R = 3958.8;
    var rlat1 = lat2 * (Math.PI / 180);
    var rlat2 = lat * (Math.PI / 180);
    var difflat = rlat2 - rlat1;
    var difflon = (lng - lng2) * (Math.PI / 180);
    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
    return d;
}

export function getStreetOnly(address) {
    return address.streetNumber + " " + address.street;
}
