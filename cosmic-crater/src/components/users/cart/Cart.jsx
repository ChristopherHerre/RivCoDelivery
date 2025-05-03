import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { roundedToFixed } from '../../App';
import axios from 'axios';
import { fetchCart } from '../checkout/CheckoutForm';

export async function saveCartToBackend(cart, userId) {
    if (!userId) {
        throw new Error('Cannot save cart: User ID is required');
        return;
    }

    try {
        const response = await axios.post('/api/cart', { 
            cart,
            userId 
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
        if (profile?.sub) {
            try {
                const response = await axios.post('/api/cart', { 
                    cart: newCart,
                    userId: profile.sub 
                }).then(response => {
                    setCart(newCart);
                    calcSubtotal(newCart, setSubtotal);
                    console.log('Cart saved after removal:', response.data);
                }).catch(error => {
                    console.error('Error saving cart after removal:', error);
                });
            } catch (error) {
                console.error('Error saving cart after removal:', error);
            }
        }
    }

    function CartItems(props) {
        const cart = props.cart;
        return (
            <div>
                <div className="row">
                    <div className="col-sm-12">
                        <span className="p-3">
                            { cart.length === 0 ? "Empty." : ""}
                        </span>
                    </div>
                </div>
                {
                    cart.map((cartItem, key) => {
                        return (
                            <div className="cartitem p-3" key={key}>
                                <CartItemDetails
                                    USDollar={USDollar}
                                    cartItem={cartItem} />
                                <div className="row text-sm-end">
                                    <div className="col-sm-6">
                                        <QuantitySelector 
                                            key2={key} 
                                            cartItem={cartItem} 
                                            setCart={setCart} 
                                        />
                                    </div>
                                    <div className="col-sm-6 float-sm-right">
                                        <button
                                            className="btn btn-danger btn-sm form-control"
                                            onClick={(e) => removeFromCart(key)}>
                                                <i className="bi bi-trash3"> </i>
                                                Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        );
    }
    const getRestaurantId = () => {
        if (!cart || cart.length === 0) return null;
        if (!cart[0].restaurant_id) {
            console.error('No restaurant_id found in cart item:', cart[0]);
            return null;
        }
        return cart[0].restaurant_id;
    };
    // In Cart.jsx
    return (
        <div className="m-1">
            {/* Add loading check and null check for cart */}
            {!cartLoading && cart.length > 0 && (
                <button 
                    className="btn btn-secondary btn-lg" 
                    onClick={() => navigate(`/${getRestaurantId()}/menu`)}
                >
                    <i className="bi bi-arrow-return-left"> </i>
                    Back
                </button>
            )}
            <h1>Shopping Cart</h1>
            <div className="row">
                <div className="col-sm-7">
                    {cartLoading ? (
                        <div>Loading cart...</div>
                    ) : (
                        <CartItems cart={cart} />
                    )}
                </div>
                <div className="col-sm-5">
                    <Subtotal
                        USDollar={USDollar}
                        subtotal={subtotal} 
                    />
                    {/* Add loading check and null check for cart */}
                    {!cartLoading && cart.length > 0 && (
                        <button 
                            className="btn btn-primary form-control" 
                            onClick={() => {
                                //saveCartToBackend(cart, profile.sub);
                                navigate(`/${getRestaurantId()}/checkout`);
                            }}
                        >
                            Checkout
                        </button>
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
    async function decrement(key, setCart) {
        setCart(cart => {
            const minQuantity = 2;
            return cart.map((cartItem, i) => {
                if (cartItem.quantity < minQuantity)
                    return cartItem;
                if (key === i) {
                    return { ...cartItem, quantity: cartItem.quantity - 1 }
                } else {
                    return cartItem;
                }
            })
        });
    }
    async function increment(key, setCart) {
        setCart(cart => {
            const maxQuantity = 20;
            return cart.map((cartItem, i) => {
                if (key === i) {
                    if (cartItem.quantity >= maxQuantity) {
                        return { ...cartItem, quantity: maxQuantity }
                    }
                    return { ...cartItem, quantity: cartItem.quantity + 1 }
                } else {
                    return cartItem;
                }
            })
        });
    }
    return (
        <span className="input-group mb-1">
            <button
                type="button"
                className="btn btn-primary btn-sm btn-outline-secondary text-white form-control"
                onClick={(e) => decrement(key, setCart)}>
                <i className="bi bi-dash-lg"></i>
            </button>
            <input
                className={"input-number text-center"}
                disabled="disabled"
                type="textparse"
                value={cartItem.quantity}
                size="2" />
            <button
                type="button"
                className="btn btn-primary btn-sm btn-outline-secondary text-white form-control"
                onClick={(e) => increment(key, setCart)}>
                <i className="bi bi-plus-lg"></i>
            </button>
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
            <h5>{cartItem.name}</h5>
            <b className="text-success">
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
            <b className="amount text-success">
                {USDollar.format(subtotal)}
            </b>
        </h4>
    );
}