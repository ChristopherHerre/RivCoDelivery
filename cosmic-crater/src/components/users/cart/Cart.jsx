import React, { useEffect, useState } from 'react';
import ResponsiveFlexRow from '../../common/ResponsiveFlexRow';
import Button from '../../common/Button';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { roundedToFixed } from '../../App';
import axios from 'axios';
import { fetchCart } from '../checkout/CheckoutForm';
import { parseRestaurantId, getRestaurantMenuUrl, getRestaurantCheckoutUrl, slugify } from '../../../utils/restaurantUrls';

export async function saveCartToBackend(cart, userId) {
    if (!userId) {
        throw new Error('Cannot save cart: User ID is required');
        return;
    }

    try {
        // If cart is empty, use DELETE endpoint
        if (!cart || cart.length === 0) {
            const response = await axios.delete('/api/cart', {
                withCredentials: true
            });
            console.log('Cart cleared:', response.data);
            return response.data;
        }
        
        // Backend gets userId from session, not from body
        const response = await axios.post('/api/cart', { 
            cart
        }, {
            withCredentials: true
        });
        console.log('Cart saved:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error saving cart:', error);
        throw error; // Re-throw to let the component handle the error
    }
}

export default function Cart(props) {
    const cart = props.cart;
    const setCart = props.setCart;
    const [subtotal, setSubtotal] = useState(0.00);
    const USDollar = props.USDollar;
    const profile = JSON.parse(localStorage.getItem('profile'));
    //const [cart, setLocalCart] = useState([]);
	const [cartLoading, setCartLoading] = useState(true);
    const navigate = useNavigate();
    const params = useParams();
    const { restaurant: restaurantParam, city } = params;
    const [restaurantData, setRestaurantData] = useState(null);

    // Get restaurant ID from the first cart item
    //const restaurant = cart.length > 0 ? cart[0].restaurant_id : null;

    useEffect(() => {
		const fetchCart = async () => {
			//const profile = JSON.parse(localStorage.getItem('profile'));
			if (!profile?.sub) {
				console.log("No profile found");
				navigate("/");
				return;
			}
			try {
				const response = await axios.get('/api/cart', {
					headers: {
						Authorization: `Bearer ${profile.sub}`
					},
					withCredentials: true
				});
				if (response.data && Array.isArray(response.data)) {
					//setCart(response.data);
					setCart(response.data);
					if (response.data.length === 0) {
						console.log("Cart is empty");
						navigate("/");
					}
				}
			} catch (error) {
				console.error('Error loading cart:', error);
				navigate("/");
			} finally {
				setCartLoading(false);
			}
		};
		fetchCart();
	}, [navigate, setCart]);

    useEffect(() => {
        let newSubtotal = calcSubtotal(cart, setSubtotal);
        setSubtotal(newSubtotal);
    }, [cart, setCart, profile]);

    async function removeFromCart(ciid) {
        const newCart = cart.filter((cartItem, k) => {
            return k !== ciid;
        });
        // Optimistic update - update UI immediately
        setCart(newCart);
        calcSubtotal(newCart, setSubtotal);
        
        // Then save to backend if user is logged in
        if (profile?.sub) {
            try {
                // If cart is empty, use DELETE endpoint instead of POST
                if (newCart.length === 0) {
                    const response = await axios.delete('/api/cart', {
                        withCredentials: true
                    });
                    console.log('Cart cleared:', response.data);
                } else {
                    // Backend gets userId from session, not from body
                    const response = await axios.post('/api/cart', { 
                        cart: newCart
                    }, {
                        withCredentials: true
                    });
                    console.log('Cart saved after removal:', response.data);
                }
            } catch (error) {
                console.error('Error saving cart after removal:', error);
                // Revert on error - restore original cart
                setCart(cart);
                calcSubtotal(cart, setSubtotal);
            }
        }
    }

    function CartItems(props) {
        const cart = props.cart;
        return (
            <div>
                {cart.length === 0 && (
                    <div className="flex">
                        <div className="w-full">
                            <span className="p-3">Empty.</span>
                        </div>
                    </div>
                )}
                {
                    cart.map((cartItem, key) => {
                        return (
                            <div className="cartitem" key={key}>
                                <ResponsiveFlexRow justify="between" align="center" className="gap-3 flex-wrap">
                                    <div className="flex-1 min-w-[220px]">
                                        <CartItemDetails
                                            USDollar={USDollar}
                                            cartItem={cartItem}
                                        />
                                    </div>
                                    <QuantitySelector 
                                        key2={key} 
                                        cartItem={cartItem} 
                                        setCart={setCart}
                                        setSubtotal={setSubtotal}
                                    />
                                    <Button
        type="button"
        variant="danger"
        size="sm"
        onClick={(e) => {
            e.preventDefault();
            removeFromCart(key);
        }}
    >
                                        <i className="bi bi-trash3"> </i>
                                        Remove
                                    </Button>
                                </ResponsiveFlexRow>
                            </div>
                        );
                    })
                }
            </div>
        );
    }
    const getRestaurantId = () => {
        // Try route params first (new format)
        if (restaurantParam) {
            const routeId = parseRestaurantId(restaurantParam);
            if (routeId) return routeId;
        }
        // Fall back to cart
        if (!cart || cart.length === 0) return null;
        if (!cart[0].restaurant_id) {
            console.error('No restaurant_id found in cart item:', cart[0]);
            return null;
        }
        return cart[0].restaurant_id;
    };

    // Fetch restaurant data for building URLs
    useEffect(() => {
        const restaurantId = getRestaurantId();
        if (restaurantId && !restaurantData) {
            axios.get(`/api/public/restaurants/${restaurantId}`)
                .then(res => {
                    setRestaurantData(res.data);
                })
                .catch(err => {
                    console.error('Error fetching restaurant data:', err);
                });
        }
    }, [restaurantParam, cart]);

    const getMenuUrl = () => {
        if (restaurantData && restaurantData.city_slug) {
            return getRestaurantMenuUrl(restaurantData);
        }
        const restaurantId = getRestaurantId();
        return restaurantId ? `/${restaurantId}/menu` : '/';
    };

    const getCheckoutUrl = () => {
        if (restaurantData && restaurantData.city_slug) {
            return getRestaurantCheckoutUrl(restaurantData);
        }
        const restaurantId = getRestaurantId();
        return restaurantId ? `/${restaurantId}/checkout` : '/';
    };

    // In Cart.jsx
    return (
        <div className="mx-auto">
            <h1>Shopping Cart</h1>
            <div className="flex flex-wrap">
                <div className="w-full sm:w-7/12 sm:pr-4">
                    {cartLoading ? (
                        <div>Loading cart...</div>
                    ) : (
                        <CartItems cart={cart} />
                    )}
                </div>
                <div className="w-full sm:w-5/12">
                    <Subtotal
                        USDollar={USDollar}
                        subtotal={subtotal} 
                    />
                    {/* Add loading check and null check for cart */}
                    {!cartLoading && cart.length > 0 && (
                        <Button 
                            fullWidth
                            onClick={async () => {
                                // Save cart to backend before navigating to ensure checkout has latest data
                                if (profile?.sub) {
                                    try {
                                        if (cart.length === 0) {
                                            await axios.delete('/api/cart', {
                                                withCredentials: true
                                            });
                                        } else {
                                            await axios.post('/api/cart', { 
                                                cart
                                            }, {
                                                withCredentials: true
                                            });
                                        }
                                    } catch (error) {
                                        console.error('Error saving cart before checkout:', error);
                                    }
                                }
                                navigate(getCheckoutUrl());
                            }}
                        >
                            Checkout
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function QuantitySelector(props) {
    const key = props.key2;
    const cartItem = props.cartItem;
    const setCart = props.setCart;
    const setSubtotal = props.setSubtotal;
    const profile = JSON.parse(localStorage.getItem('profile'));
    
    async function saveCartToBackend(updatedCart) {
        if (!profile?.sub) return;
        
        try {
            if (updatedCart.length === 0) {
                await axios.delete('/api/cart', {
                    withCredentials: true
                });
            } else {
                await axios.post('/api/cart', { 
                    cart: updatedCart
                }, {
                    withCredentials: true
                });
            }
        } catch (error) {
            console.error('Error saving cart after quantity change:', error);
            throw error;
        }
    }
    
    async function decrement(key, setCart) {
        setCart(cart => {
            const minQuantity = 2;
            const updatedCart = cart.map((cartItem, i) => {
                if (cartItem.quantity < minQuantity)
                    return cartItem;
                if (key === i) {
                    return { ...cartItem, quantity: cartItem.quantity - 1 }
                } else {
                    return cartItem;
                }
            });
            
            // Update subtotal
            if (setSubtotal) {
                calcSubtotal(updatedCart, setSubtotal);
            }
            
            // Save to backend
            saveCartToBackend(updatedCart).catch(err => {
                console.error('Failed to save cart:', err);
            });
            
            return updatedCart;
        });
    }
    async function increment(key, setCart) {
        setCart(cart => {
            const maxQuantity = 20;
            const updatedCart = cart.map((cartItem, i) => {
                if (key === i) {
                    if (cartItem.quantity >= maxQuantity) {
                        return { ...cartItem, quantity: maxQuantity }
                    }
                    return { ...cartItem, quantity: cartItem.quantity + 1 }
                } else {
                    return cartItem;
                }
            });
            
            // Update subtotal
            if (setSubtotal) {
                calcSubtotal(updatedCart, setSubtotal);
            }
            
            // Save to backend
            saveCartToBackend(updatedCart).catch(err => {
                console.error('Failed to save cart:', err);
            });
            
            return updatedCart;
        });
    }
    return (
        <span className="flex items-center gap-1">
            <Button
                type="button"
                size="sm"
                onClick={(e) => decrement(key, setCart)}
                iconOnly
            >
                <i className="bi bi-dash-lg"></i>
            </Button>
            <input
                className={"input-number text-center w-12"}
                disabled="disabled"
                type="textparse"
                value={cartItem.quantity}
                size="2" />
            <Button
                type="button"
                size="sm"
                onClick={(e) => increment(key, setCart)}
                iconOnly
            >
                <i className="bi bi-plus-lg"></i>
            </Button>
        </span>
    );
}

// Prints the name of the ingredient, half/whole, and the amount of the ingredient.
export function Ingredients(cartItem, comma = 1) {
    let ingredients = cartItem.ingredients || [];
    let halfer = cartItem.halfer || [];
    let arrs = cartItem.arrs || [];
    let str = "";
    if (!arrs || !halfer || !ingredients) {
        return "";
    }

    for (let i = 0; i < halfer.length; i++) {
        // Add null checks for arrs[i]
        if (!arrs[i]) continue;
        
        let h = arrs[i]['halfable'] ? 
            ((comma == 1 ? ", " : ";") + halfer[i][0]) : "";
        let itemWithOptions = arrs[i]['customize'] ? 
            " ("+ ingredients[i][1] + h + ")" : "";
        str += ingredients[i][0] ? 
            ((comma == 1 ? "" : "[") + arrs[i]['ingredients_name'] + (itemWithOptions) + (comma == 1 ? ", " : "] "))  : "";
    }
    str = str.replace(/,\s*$/, "");
    console.log("!! " + str);
    return str;
}

// Prints the cart item name, price, size, and ingredients.
export function CartItemDetails(props) {
    const cartItem = props.cartItem;
    const USDollar = props.USDollar;
    console.log("cartItem: " + cartItem.ingredients);
    return (
        <div>
            <h5>{cartItem.display_name || cartItem.name}</h5>
            <b className="text-green-600">
                {USDollar.format(cartItem.price)} x {cartItem.quantity} = {USDollar.format(roundedToFixed(cartItem.price * cartItem.quantity, 2))}
            </b>
            <div>
                <span>{cartItem.val1 == 1 ? cartItem.size1 : ""}</span>
                <span>{cartItem.val2 == 1 ? cartItem.size2 : ""}</span>
                <span>{cartItem.val3 == 1 ? cartItem.size3 : ""}</span>
                <span>{cartItem.val4 == 1 ? cartItem.size4 : ""}</span>
            </div>
            <small>{Ingredients(cartItem)}</small>
        </div>
    );
}

// Adds up the subtotal from cart item prices.
export function calcSubtotal(c, setSubtotal) {
    let totalAmount = 0;
    for (const item in c) {
        totalAmount += c[item].quantity * c[item].price;
    }
    setSubtotal(totalAmount);
    return roundedToFixed(totalAmount, 2);
};

export function Subtotal(props) {
    const subtotal = props.subtotal;
    const USDollar = props.USDollar;
    return (
        <h4 className="currency-item">
            <span>Subtotal: </span>
            <b className="amount text-green-600">
                {USDollar.format(subtotal)}
            </b>
        </h4>
    );
}