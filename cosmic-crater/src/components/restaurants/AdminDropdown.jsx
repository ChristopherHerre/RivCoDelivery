import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';

const AdminDropdown = (props) => {
    const full = props.full;
    const profile = props.profile;
    const size = props.size || (full ? 'md' : undefined);
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
        <div className={`relative ${full ? 'w-full' : 'inline-block'}`} ref={dropdownRef}>
            <div className={full ? "" : "flex gap-2"}>
                {profile ? (
                    <Button
                        variant="secondary"
                        size={size}
                        fullWidth={full}
                        className={full ? "whitespace-nowrap w-full" : "mt-1"}
                        onClick={toggleDropdown}
                        aria-haspopup="true"
                        aria-expanded={isOpen}
                    >
                        <i className="bi bi-briefcase"></i>
                        Admin
                        <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-xs`}></i>
                    </Button>
                ) : null}
                {!full && (
                    <Link to="/donate">
                        <Button
                            variant="secondary"
                            size="lg"
                            className="mt-1 mr-1"
                        >
                            <i className="bi bi-credit-card-fill"></i>
                            Donate
                        </Button>
                    </Link>
                )}
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
