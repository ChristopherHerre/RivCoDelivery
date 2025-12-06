import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

const AdminDropdown = (props) => {
    const full = props.full;
    const profile = props.profile;
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        // Handle ESC key to close dropdown
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const toggleDropdown = (e) => {
        e.preventDefault();
        setIsOpen(!isOpen);
    };

    const handleLinkClick = () => {
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block" ref={dropdownRef}>
            <div className="flex gap-2">
                {profile ? (
                    <button
                        className={
                            full
                                ? "bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors mt-1 w-full flex items-center justify-center gap-2"
                                : "bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors mt-1 flex items-center gap-2"
                        }
                        onClick={toggleDropdown}
                        aria-haspopup="true"
                        aria-expanded={isOpen}
                    >
                        <i className="bi bi-briefcase"></i>
                        Admin
                        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-xs`}></i>
                    </button>
                ) : null}
                <Link to="/donate">
                    <button
                        className={
                            full
                                ? "bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors mt-1 mr-1 w-full flex items-center justify-center gap-2"
                                : "bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors mt-1 mr-1 flex items-center gap-2"
                        }
                    >
                        <i className="bi bi-credit-card-fill"></i>
                        Donate
                    </button>
                </Link>
            </div>
            {profile && isOpen && (
                <div
                    className="absolute z-50 mt-1 bg-gray-800 rounded shadow-lg min-w-full whitespace-nowrap"
                    role="menu"
                >
                    <Link 
                        to="/users" 
                        className="block px-4 py-2 text-white hover:bg-gray-700 transition-colors first:rounded-t last:rounded-b"
                        onClick={handleLinkClick}
                        role="menuitem"
                    >
                        <i className="bi bi-people"></i>
                        {' '}User Management
                    </Link>
                    <Link 
                        to="/admin" 
                        className="block px-4 py-2 text-white hover:bg-gray-700 transition-colors first:rounded-t last:rounded-b"
                        onClick={handleLinkClick}
                        role="menuitem"
                    >
                        <i className="bi bi-sliders2-vertical"></i>
                        {' '}Restaurant Control Panel
                    </Link>
                    <Link 
                        to="/orders" 
                        className="block px-4 py-2 text-white hover:bg-gray-700 transition-colors first:rounded-t last:rounded-b"
                        onClick={handleLinkClick}
                        role="menuitem"
                    >
                        <i className="bi bi-box2"></i>
                        {' '}Driver Orders
                    </Link>
                </div>
            )}
        </div>
    );
};

export default AdminDropdown;
