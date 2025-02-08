import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL, Spinner, MAX_RETRY_ATTEMPTS } from '../App';

export default function ShowMenu(props) {
    const restaurant = props.restaurant;
    const menuItem = props.menuItem;
    const setMenuItem = props.setMenuItem;
    const restaurantName = props.restaurantName;
    const [menu, setMenu] = useState([]);
    const navigate = useNavigate();
    const result = Object.groupBy(menu, r => r.category);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const fetchMenu = async (attempt = 1) => {
            if (props.restaurant < 0) navigate("/");
            try {
                const res = await axios.get(API_URL + `/api/restaurants2/${restaurant}/menu`);
                console.log(res.data);
                setMenu(res.data);
                setLoaded(true);
            } catch (err) {
                if (attempt < MAX_RETRY_ATTEMPTS) {
                    fetchMenu(attempt + 1);
                } else {
                    console.error('Error fetching menu:', err);
                    window.location.href = '/404-page.html';
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

    const menuData = [];
    function populateMenuData() {
        for (const j in result) {
            for (const i in result[j]) {
                menuData.push(result[j][i]);
            }
        }
    }
    populateMenuData();
    return (
        <>
            <Link to="/">
                <button className="btn btn-secondary btn-lg m-1">
                    <i className="bi bi-arrow-return-left"></i> Back
                </button>
            </Link>
            {loaded ? <h2 className="m-1">{restaurantName} Menu</h2> : ""}
            {
                loaded ? Object.keys(result).map((category, categoryIndex) => (
                    <span key={categoryIndex}>
                        <div className="row">
                            {result[category].map((data, key) => {
                                const isNewCategory = data.category != null && lastCategory != data.category;
                                if (isNewCategory) {
                                    setLastCategoryPrinted(data.category);
                                }
                                return (
                                    <React.Fragment key={data.id}>
                                        {isNewCategory &&
                                        <h5 className="indent">
                                            {data.category}
                                        </h5>}
                                        <div className={"col-md-6"} key={data.id}>
                                            <Link to="/menu/item">
                                                <button
                                                        className="btn btn-primary m-1 w-100"
                                                        onClick={(e) => changeMenuItem(data)}>
                                                    {data.name}
                                                    <span> - $</span>
                                                    {data.price != null &&
                                                    <span className="fw-bold">
                                                        {data.price}
                                                    </span>}
                                                    {data.price2 != null && <span> - $</span>}
                                                    {data.price2 != null &&
                                                    <span className="fw-bold">
                                                        {data.price2}
                                                    </span>}
                                                    {data.price3 != null && <span> - $</span>}
                                                    {data.price3 != null &&
                                                    <span className="fw-bold">
                                                        {data.price3}
                                                    </span>}
                                                    {data.price4 != null && <span> - $</span>}
                                                    {data.price4 != null &&
                                                    <span className="fw-bold">
                                                        {data.price4}
                                                    </span>}
                                                </button>
                                            </Link>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </span>
                ))
                : 
                (<Spinner />)
            }
        </>
    );
}

