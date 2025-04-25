import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios';
import QuantitySelector from '../../../users/QuantitySelector';
import currency from 'currency.js';
import { MAX_RETRY_ATTEMPTS } from '../../../App';
import Spinner from '../../../users/Spinner';
import { groupBy } from '../../RestaurantsList';
import { Box, Button, CircularProgress } from '@mui/material';
import {
    Typography,
    Paper,
    Grid,
    FormControl,
    FormControlLabel,
    Checkbox,
    Radio,
    RadioGroup,
    TextField,
    Select,
    InputLabel,
    MenuItem as MuiMenuItem,
    Chip,
    Container
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

export default function MenuItem(props) {
    const USDollar = props.USDollar;
    const restaurantName = props.restaurantName;
    const debug = props.debug;
    const cart = props.cart;
    const setCart = props.setCart;
    const [itemConfig, setItemConfig] = useState([]);
    const [itemIngredients, setItemIngredients] = useState([]);
    const [val1, setVal1] = useState(1);
    const [val2, setVal2] = useState(0);
    const [val3, setVal3] = useState(0);
    const [val4, setVal4] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(-1);
    const result = groupBy(itemIngredients, i => i.type);
    const [enabled, setEnabled] = useState([]);
    const [halfables, setHalfables] = useState([]);
    const [customs, setCustoms] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [loading2, setLoading2] = useState(true);
    useEffect(() => {
        const fetchMenuItem = async (attempt = 1) => {
            if (props.menuItem < 0) navigate("/");
            console.log("menuItem: " + props.menuItem);
            try {
                const res = await axios.get('/api/menu/item', { params: { menuItem: props.menuItem } });
                setItemConfig(res.data);
                if (res.data[0] != undefined)
                    setPrice(res.data[0].price);
                setLoading(false);
            } catch (err) {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchMenuItem(attempt + 1);
                } else {
                    console.error('Error fetching menu item:', err);
                }
            }
        };
        const fetchMenuItemIngredients = async (attempt = 1) => {
            try {
                const res = await axios.get('/api/menu/item/ingredients', { params: { menuItem: props.menuItem } });
                setItemIngredients(res.data);
                const initialEnabled = res.data.map(ingredient => ingredient.selected || false);
                setEnabled(initialEnabled);
            } catch (err) {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchMenuItemIngredients(attempt + 1);
                } else {
                    console.error('Error fetching menu item ingredients:', err);
                }
            } finally {
                setLoading2(false);
            }
        };
        fetchMenuItem();
        fetchMenuItemIngredients();
    }, [cart, setCart, setPrice, setEnabled, setHalfables, setCustoms, setVal1, setVal2, setVal3, setVal4]);

    function addToCart(e, item) {
        e.preventDefault();
        
        // Create arrays to store customizations using state values
        let boxes = [];
        let boxes2 = [];
        
        // Use state values instead of form elements
        ingredientsData.forEach((ingredient, idx) => {
            boxes.push([enabled[idx], customs[idx] || 'Regular']);
            boxes2.push([halfables[idx] || 'Whole']);
        });
        
        const cartItem = {
            name: item.name,
            address: item.restaurantAddress,
            restaurant: restaurantName,
            size1: item.size1,
            val1: val1,
            size2: item.size2,
            val2: val2,
            size3: item.size3,
            val3: val3,
            size4: item.size4,
            val4: val4,
            ingredients: boxes,
            arrs: ingredientsData,
            quantity: quantity,
            price: price,
            customizer: customs,  // Use the state directly
            halfer: boxes2,
        };
        
        // Rest of your code...
        cart.push(cartItem);
        setCart([...cart]); // Better way to update cart state
        navigate("/menu");
    }
    const ingredientsData = [];
    function populateIngredientData() {
        for (const j in result) {
            for (const i in result[j]) {
                ingredientsData.push(result[j][i]);
            }
        }
        // Sort ingredientsData by the sort_order column
        ingredientsData.sort((a, b) => a.sort_order - b.sort_order);
    }
    let lastCategory = "";
    function setLastCategoryPrinted(v) {
        lastCategory = v;
    }
    populateIngredientData();
    function MI() {
        return (
            itemConfig.map((item, key) => {
                function calcItemTotal(uu) {
                    // Start with base price of 0
                    let configPrice = currency(0);
                    
                    // Process each ingredient's price contribution
                    ingredientsData.forEach((ingredient, key) => {
                        // Only calculate for enabled ingredients
                        if (enabled[key] === true) {
                            // Determine price based on customization (Extra, Easy, Regular)
                            let ingredientPrice = currency(0);
                            if (customs[key] === "Extra") {
                                ingredientPrice = currency(ingredient.extra_price);
                            } else if (customs[key] === "Easy") {
                                ingredientPrice = currency(ingredient.easy_price);
                            } else {
                                // Regular price
                                ingredientPrice = currency(ingredient.price);
                            }
                            // Apply half-price calculation if ingredient is only on half the item
                            const isHalfItem = halfables[key] === "Right Half" || halfables[key] === "Left Half";
                            if (isHalfItem) {
                                ingredientPrice = ingredientPrice.divide(2);
                            }
                            // Add to running total
                            configPrice = configPrice.add(ingredientPrice.value);
                        }
                    });
                    
                    // Add base item price according to size selection (uu)
                    const itemSizePrice = uu === 1 ? item.price : 
                                         uu === 2 ? item.price2 : 
                                         uu === 3 ? item.price3 : 
                                         uu === 4 ? item.price4 : item.price;
                    // Update the final price
                    setPrice(configPrice.add(itemSizePrice).value);
                }
                function itemTotal() {
                    if (val1 == 1) {
                        calcItemTotal(1);
                    } else if (val2 == 1) {
                        calcItemTotal(2);
                    } else if (val3 == 1) {
                        calcItemTotal(3);
                    } else if (val4 == 1) {
                        calcItemTotal(4);
                    }
                }
                useEffect(()=>{
                    itemTotal();
                }, [val1, val2, val3, val4])
                function changeRadio1(e) {
                    setVal1(1);
                    setVal2(0);
                    setVal3(0);
                    setVal4(0);
                    calcItemTotal(1);
                }
                function changeRadio2(e) {
                    setVal1(0);
                    setVal2(1);
                    setVal3(0);
                    setVal4(0);
                    calcItemTotal(2);
                }
                function changeRadio3(e) {
                    setVal1(0);
                    setVal2(0);
                    setVal3(1);
                    setVal4(0);
                    calcItemTotal(3);
                }
                function changeRadio4(e) {
                    setVal1(0);
                    setVal2(0);
                    setVal3(0);
                    setVal4(1);
                    calcItemTotal(4);
                }
                return (
                    <form key={key} onSubmit={(e) => addToCart(e, item)}>
                        <Box sx={{ mb: 4 }}>
                            <Grid container justifyContent="center">
                                <Grid item xs={12}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" component="h2" sx={{ 
                                            mb: 1,
                                            fontWeight: 600,
                                            color: '#2e4765'
                                        }}>
                                            {item.name}
                                        </Typography>
                                        <Typography variant="h5" component="h3" sx={{ mb: 2 }}>
                                            <Box component="span" sx={{ 
                                                fontWeight: 'bold',
                                                color: '#2e7c67' 
                                            }}>
                                                {USDollar.format(price)}
                                            </Box>
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item md={6}>
                                <Box sx={{ mb: 3 }}>
                                    <Box sx={{ mb: 2 }}> {/* Add this wrapper Box to match ingredient categories */}
                                        <Typography 
                                            variant="h6" 
                                            sx={{ 
                                                ml: 1,
                                                mb: 1.5,
                                                fontWeight: 600,
                                                color: '#2e4765',
                                                position: 'relative',
                                                display: 'inline-block',
                                                pb: 0.5
                                            }}
                                        >
                                            <Box 
                                                component="span" 
                                                sx={{ 
                                                    color: '#ff6b6b',
                                                    mr: 0.5
                                                }}
                                            >
                                                *
                                            </Box>
                                            Size
                                        </Typography>
                                    </Box>
                                    
                                    <FormControl component="fieldset">
                                        <RadioGroup name="itemSize" value={
                                            val1 ? "size1" : 
                                            val2 ? "size2" : 
                                            val3 ? "size3" : 
                                            val4 ? "size4" : "size1"
                                        }>
                                            {(item.size1 != null && item.size1 !== "") && (
                                                <Paper 
                                                    elevation={0}
                                                    sx={{ 
                                                        p: 3, 
                                                        mb: 2, 
                                                        borderRadius: 2, 
                                                        bgcolor: '#2e4765',
                                                        color: 'white',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        '&:before': {
                                                            content: '""',
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '6px',
                                                            height: '100%',
                                                            backgroundColor: '#ff9966',
                                                        },
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        value="size1"
                                                        control={
                                                            <Radio 
                                                                required
                                                                checked={val1}
                                                                onChange={(e) => changeRadio1(e)}
                                                                sx={{
                                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                                    '&.Mui-checked': {
                                                                        color: '#ff9966',
                                                                    },
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="body1">
                                                                {item.size1} {debug && val1 ? val1 : ""}
                                                            </Typography>
                                                        }
                                                    />
                                                </Paper>
                                            )}
                                            
                                            {(item.size2 != null && item.size2 !== "") && (
                                                <Paper 
                                                    elevation={0}
                                                    sx={{ 
                                                        p: 3, 
                                                        mb: 2, 
                                                        borderRadius: 2, 
                                                        bgcolor: '#2e4765',
                                                        color: 'white',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        '&:before': {
                                                            content: '""',
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '6px',
                                                            height: '100%',
                                                            backgroundColor: '#ff9966',
                                                        },
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        value="size2"
                                                        control={
                                                            <Radio 
                                                                checked={val2}
                                                                onChange={(e) => changeRadio2(e)}
                                                                sx={{
                                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                                    '&.Mui-checked': {
                                                                        color: '#ff9966',
                                                                    },
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="body1">
                                                                {item.size2} {debug && val2 ? val2 : ""}
                                                            </Typography>
                                                        }
                                                    />
                                                </Paper>
                                            )}
                                            
                                            {(item.size3 != null && item.size3 !== "") && (
                                                <Paper 
                                                    elevation={0}
                                                    sx={{ 
                                                        p: 3, 
                                                        mb: 2, 
                                                        borderRadius: 2, 
                                                        bgcolor: '#2e4765',
                                                        color: 'white',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        '&:before': {
                                                            content: '""',
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '6px',
                                                            height: '100%',
                                                            backgroundColor: '#ff9966',
                                                        },
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        value="size3"
                                                        control={
                                                            <Radio 
                                                                checked={val3}
                                                                onChange={(e) => changeRadio3(e)}
                                                                sx={{
                                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                                    '&.Mui-checked': {
                                                                        color: '#ff9966',
                                                                    },
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="body1">
                                                                {item.size3} {debug && val3 ? val3 : ""}
                                                            </Typography>
                                                        }
                                                    />
                                                </Paper>
                                            )}
                                            
                                            {(item.size4 != null && item.size4 !== "") && (
                                                <Paper 
                                                    elevation={0}
                                                    sx={{ 
                                                        p: 3, 
                                                        mb: 2, 
                                                        borderRadius: 2, 
                                                        bgcolor: '#2e4765',
                                                        color: 'white',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        '&:before': {
                                                            content: '""',
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '6px',
                                                            height: '100%',
                                                            backgroundColor: '#ff9966',
                                                        },
                                                    }}
                                                >
                                                    <FormControlLabel
                                                        value="size4"
                                                        control={
                                                            <Radio 
                                                                checked={val4}
                                                                onChange={(e) => changeRadio4(e)}
                                                                sx={{
                                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                                    '&.Mui-checked': {
                                                                        color: '#ff9966',
                                                                    },
                                                                }}
                                                            />
                                                        }
                                                        label={
                                                            <Typography variant="body1">
                                                                {item.size4} {debug && val4 ? val4 : ""}
                                                            </Typography>
                                                        }
                                                    />
                                                </Paper>
                                            )}
                                        </RadioGroup>
                                    </FormControl>
                                </Box>
                            </Grid>
                            
                            <Grid item md={6}>
                                {console.log(ingredientsData)}
                                {!loading2 ? (
                                    ingredientsData.map((q, key) => {
                                        function changeEnabledRadio(e) {
                                            // Create a new array to properly update state
                                            const newEnabled = [...enabled];
                                            // Find all elements of the same type
                                            for (let i = 0; i < ingredientsData.length; i++) {
                                                if (ingredientsData[i]['type'] === q['type']) {
                                                    // Set only the clicked one to true, others to false
                                                    newEnabled[i] = (i === key);
                                                }
                                            }
                                            // Update state with the new array
                                            setEnabled(newEnabled);
                                            itemTotal();
                                        }
                                        function changeEnabledCheckbox(e) {
                                            const newEnabled = [...enabled];
                                            newEnabled[key] = !newEnabled[key];
                                            console.log(key + " " + newEnabled[key]);
                                            setEnabled(newEnabled);
                                            itemTotal();
                                        }
                                        function changeHalfer(e) {
                                            const itemKey = key; // Capture the current key in closure
                                            const newHalfables = [...halfables];
                                            newHalfables[itemKey] = e.target.value;
                                            setHalfables(newHalfables);
                                            itemTotal();
                                        }
                                        function changeCustomizer(e) {
                                            const updatedCustoms = { ...customs };
                                            updatedCustoms[key] = e.target.value;
                                            setCustoms(updatedCustoms);
                                            itemTotal();
                                        }
                                        return ingredientsData ? (
                                            // Keep the existing Material UI code for ingredients
                                            <Box key={key} sx={{ mb: 2 }}>
                                                {/* Existing ingredients code - unchanged */}
                                                {lastCategory != q['type'] ? (
                                                    <Typography 
                                                        variant="h6" 
                                                        sx={{ 
                                                            ml: 1,
                                                            mb: 1.5,
                                                            fontWeight: 600,
                                                            color: '#2e4765',
                                                            position: 'relative',
                                                            display: 'inline-block',
                                                            pb: 0.5
                                                        }}
                                                    >
                                                        {q['inputType'] == 1 && (
                                                            <Box 
                                                                component="span" 
                                                                sx={{ 
                                                                    color: '#ff6b6b',
                                                                    mr: 0.5
                                                                }}
                                                            >
                                                                *
                                                            </Box>
                                                        )}
                                                        {q['type']}
                                                    </Typography>
                                                ) : null}
                                                
                                                {setLastCategoryPrinted(q['type'])}
                                                
                                                <Paper 
                                                    elevation={0}
                                                    sx={{ 
                                                        p: 3, 
                                                        mb: 2, 
                                                        borderRadius: 2, 
                                                        bgcolor: '#2e4765',
                                                        color: 'white',
                                                        position: 'relative',
                                                        overflow: 'hidden',
                                                        '&:before': {
                                                            content: '""',
                                                            position: 'absolute',
                                                            top: 0,
                                                            left: 0,
                                                            width: '6px',
                                                            height: '100%',
                                                            backgroundColor: '#ff9966',
                                                        },
                                                    }}
                                                >
                                                    <Grid container spacing={2}>
                                                        <Grid item xs={12} lg={6}>
                                                            {q['inputType'] == 0 ? (
                                                                <FormControlLabel
                                                                    control={
                                                                        <Checkbox 
                                                                            checked={enabled[key] || false} 
                                                                            onChange={(e) => changeEnabledCheckbox(e)}
                                                                            sx={{
                                                                                color: 'rgba(255, 255, 255, 0.7)',
                                                                                '&.Mui-checked': {
                                                                                    color: '#ff9966',
                                                                                }
                                                                            }}
                                                                        />
                                                                    }
                                                                    label={q['ingredients_name']}
                                                                />
                                                            ) : (
                                                                <FormControlLabel
                                                                    control={
                                                                        <Radio 
                                                                            checked={enabled[key] || false} 
                                                                            onChange={(e) => changeEnabledRadio(e)}
                                                                            required
                                                                            name={q['type']}
                                                                            sx={{
                                                                                color: 'rgba(255, 255, 255, 0.7)',
                                                                                '&.Mui-checked': {
                                                                                    color: '#ff9966',
                                                                                }
                                                                            }}
                                                                        />
                                                                    }
                                                                    label={q['ingredients_name']}
                                                                />
                                                            )}
                                                        </Grid>
                                                        
                                                        <Grid item xs={12} lg={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                                {/* Existing halfer and customizer code - unchanged */}
                                                                {(q['halfable'] !== 0 && q['customize'] !== 0) && (
                                                                    <FormControl 
                                                                        variant="outlined" 
                                                                        size="small"
                                                                        disabled={!enabled[key]}
                                                                        sx={{ 
                                                                            minWidth: 120,
                                                                            visibility: q['customize'] == 0 || q['halfable'] == 0 ? 'hidden' : 'visible',
                                                                            '.MuiOutlinedInput-notchedOutline': {
                                                                                borderColor: 'rgba(255,255,255,0.3)',
                                                                            },
                                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                                borderColor: 'rgba(255,255,255,0.5)',
                                                                            },
                                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                                borderColor: '#ff9966',
                                                                            },
                                                                            '.MuiSvgIcon-root': {
                                                                                color: 'rgba(255,255,255,0.7)',
                                                                            },
                                                                            '.MuiSelect-select': {
                                                                                color: 'white'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Select
                                                                            value={halfables[key] || "Whole"}
                                                                            onChange={(e) => changeHalfer(e)}
                                                                            id={q['type']}
                                                                            name={"halfer"}
                                                                            sx={{ display: 'flex', justifyContent: 'flex-end' }}
                                                                        >
                                                                            <MuiMenuItem value="Left Half">Left half</MuiMenuItem>
                                                                            <MuiMenuItem value="Whole">Whole</MuiMenuItem>
                                                                            <MuiMenuItem value="Right Half">Right half</MuiMenuItem>
                                                                        </Select>
                                                                    </FormControl>
                                                                )}
                                                                
                                                                {q['customize'] !== 0 && (
                                                                    <FormControl 
                                                                        variant="outlined" 
                                                                        size="small"
                                                                        disabled={!enabled[key]}
                                                                        sx={{ 
                                                                            minWidth: 120,
                                                                            visibility: q['customize'] == 0 ? 'hidden' : 'visible',
                                                                            '.MuiOutlinedInput-notchedOutline': {
                                                                                borderColor: 'rgba(255,255,255,0.3)',
                                                                            },
                                                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                                                borderColor: 'rgba(255,255,255,0.5)',
                                                                            },
                                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                                                borderColor: '#ff9966',
                                                                            },
                                                                            '.MuiSvgIcon-root': {
                                                                                color: 'rgba(255,255,255,0.7)',
                                                                            },
                                                                            '.MuiSelect-select': {
                                                                                color: 'white'
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Select
                                                                            value={customs[key] || 'Regular'}
                                                                            onChange={(e) => changeCustomizer(e)}
                                                                            id={q['type']}
                                                                            name="customizer"
                                                                        >
                                                                            <MuiMenuItem value="Easy">Easy</MuiMenuItem>
                                                                            <MuiMenuItem value="Regular">Regular</MuiMenuItem>
                                                                            <MuiMenuItem value="Extra">Extra</MuiMenuItem>
                                                                        </Select>
                                                                    </FormControl>
                                                                )}
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                                <CircularProgress sx={{ color: '#4a6fa5' }} />
                                            </Box>
                                        );
                                    })
                                ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                        <CircularProgress sx={{ color: '#4a6fa5' }} />
                                    </Box>
                                )}
                                
                                {/* Convert quantity and add to cart buttons to Material UI */}
                                <Grid container spacing={2} sx={{ mt: 2 }}>
                                    <Grid item xs={12} md={4}>
                                        <Typography 
                                            variant="h6" 
                                            sx={{ 
                                                mb: 1.5,
                                                fontWeight: 600,
                                                color: '#2e4765',
                                            }}
                                        >
                                            <Box 
                                                component="span" 
                                                sx={{ 
                                                    color: '#ff6b6b',
                                                    mr: 0.5
                                                }}
                                            >
                                                *
                                            </Box>
                                            Quantity
                                        </Typography>
                                        <QuantitySelector
                                            inputValue={quantity}
                                            onInputValueChange={setQuantity}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={8}>
                                        <Button
                                            type="submit"
                                            variant="contained"
                                            fullWidth
                                            sx={{ 
                                                mt: { xs: 0, md: 4.5 },
                                                height: 56,
                                                bgcolor: '#4a6fa5',
                                                '&:hover': {
                                                    bgcolor: '#2e4765',
                                                }
                                            }}
                                        >
                                            Add {quantity} to cart
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </form>
                );
            })
        )
    }
    return (
        <Container>
            <Box sx={{ mb: 3 }}>
                <Link to="/menu" style={{ textDecoration: 'none' }}>
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
                        {restaurantName || "Back to Menu"}
                    </Button>
                </Link>
            
                {loading ? (
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            minHeight: 250,
                            py: 4
                        }}
                    >
                        <CircularProgress color="primary" />
                    </Box>
                ) : (
                    <MI />
                )}
            </Box>
        </Container>
    );
}