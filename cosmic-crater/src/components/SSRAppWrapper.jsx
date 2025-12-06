import React, { useEffect, useState } from 'react';
import App from './App';

export default function SSRAppWrapper() {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [checking, setChecking] = useState(true);
	
	useEffect(() => {
		const checkAuth = () => {
			const profile = localStorage.getItem('profile');
			if (profile) {
				// Verify session is still valid
				fetch('/api/session', {
					credentials: 'include'
				})
				.then(res => {
					if (res.status === 200) {
						setIsAuthenticated(true);
					} else {
						setIsAuthenticated(false);
					}
					setChecking(false);
				})
				.catch(() => {
					setIsAuthenticated(false);
					setChecking(false);
				});
			} else {
				setIsAuthenticated(false);
				setChecking(false);
			}
		};
		
		// Check on mount
		checkAuth();
		
		// Listen for profile changes
		window.addEventListener('profile-changed', checkAuth);
		
		return () => {
			window.removeEventListener('profile-changed', checkAuth);
		};
	}, []);
	
	// Don't render anything until we've checked auth
	if (checking) {
		return null;
	}
	
	// Only render App if authenticated
	if (!isAuthenticated) {
		return null;
	}
	
	return <App />;
}

