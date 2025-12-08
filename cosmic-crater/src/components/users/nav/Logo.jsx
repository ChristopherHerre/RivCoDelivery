import { Link } from 'react-router-dom';
import { useEffect } from 'react';

function Logo(props) {
    useEffect(() => {
        // Check if Bungee Spice font loaded, if not, force fallback
        if (document.fonts && document.fonts.check) {
            const checkFont = async () => {
                try {
                    await document.fonts.ready;
                    const bungeeSpiceLoaded = document.fonts.check('20pt "Bungee Spice"');
                    if (!bungeeSpiceLoaded) {
                        // Font didn't load, ensure fallback is visible
                        const logoElements = document.querySelectorAll('.logofont');
                        logoElements.forEach(el => {
                            el.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif';
                        });
                    }
                } catch (e) {
                    // If font loading API fails, ensure fallback shows
                    const logoElements = document.querySelectorAll('.logofont');
                    logoElements.forEach(el => {
                        el.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif';
                    });
                }
            };
            
            // Check after a short delay to allow font to start loading
            const timeout = setTimeout(checkFont, 100);
            // Also check after fonts are ready
            if (document.fonts.ready) {
                document.fonts.ready.then(checkFont);
            }
            
            return () => clearTimeout(timeout);
        }
    }, []);

    return (
        <div className="w-full lg:w-auto flex items-center">
            <Link to="/">
                <button 
                        className="removebutton align-text-bottom whitespace-nowrap" 
                        type="button">
                    <span className="logofont2">RivCo</span>
                    <span className="logofont">DELIVERY</span>
                </button>
            </Link>
        </div>
    );
}
export default Logo;