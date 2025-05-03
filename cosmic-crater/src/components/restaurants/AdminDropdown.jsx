import { Link } from 'react-router-dom';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const AdminDropdown = (props) => {
    const full = props.full;
    const profile = props.profile;
    return (
        <div className="dropdown">
            {profile ? (
                <a
                    className={
                        full
                            ? "btn btn-secondary mt-1 dropdown-toggle form-control"
                            : "btn btn-secondary mt-1 dropdown-toggle"
                    }
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    role="button"
                    id="dropdownMenuLink"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                >
                    <i className="bi bi-briefcase"> </i>
                    Admin
                </a>
            ) : ""}
            <Link to="/donate">
                <button
                    className={
                        full
                            ? "btn btn-secondary mt-1 mr-1 form-control"
                            : "btn btn-secondary mt-1 mr-1"
                    }
                >
                    <i className="bi bi-credit-card-fill"> </i>
                    Donate
                </button>
            </Link>
            {profile ? (
                <div
                    className="dropdown-menu bg-dark form-control text-white"
                    aria-labelledby="dropdownMenuLink"
                >
                    <Link to="/users" className="dropdown-item text-white hover-black">
                        <i className="bi bi-people"> </i>
                        User Management
                    </Link>
                    <Link to="/admin" className="dropdown-item text-white hover-black">
                        <i className="bi bi-sliders2-vertical"> </i>
                        Restaurant Control Panel
                    </Link>
                    <Link to="/orders" className="dropdown-item text-white hover-black">
                        <i className="bi bi-box2"> </i>
                        Driver Orders
                    </Link>
                </div>
            ) : ""}
        </div>
    );
};

export default AdminDropdown;
