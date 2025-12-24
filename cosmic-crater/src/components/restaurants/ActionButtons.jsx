import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';
import AdminDropdown from './AdminDropdown';

export default function ActionButtons({ profile, onSuggestClick, className = '' }) {
    const navigate = useNavigate();

    const handleSuggestClick = () => {
        if (onSuggestClick) {
            onSuggestClick();
        } else {
            navigate('/suggest-restaurant');
        }
    };

    return (
        <div className={`card bg-base-100 shadow-md ${className}`}>
            <div className="card-body p-4">
                <div className="form-control mb-4">
                    <label className="label">
                        <span className="label-text text-base-content font-bold">Database:</span>
                    </label>
                </div>
                <div className="flex flex-col gap-4">
                    <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={handleSuggestClick}
                        className="whitespace-nowrap w-full"
                    >
                        <i className="bi bi-plus-circle"></i>
                        Suggest a Restaurant
                    </Button>
                    {profile && (
                        <div className="w-full">
                            <AdminDropdown 
                                profile={profile}
                                full={true}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

