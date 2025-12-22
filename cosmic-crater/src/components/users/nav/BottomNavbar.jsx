import AdminDropdown from '../../restaurants/AdminDropdown';

function BottomNavbar(props) {
    const profile = props.profile;
    return (
        <div id="bottom-navbar" className="flex flex-wrap gap-2 mt-4">
            <div className="w-full md:hidden">
                <AdminDropdown 
                    className="" 
                    profile={profile} 
                    full={1}
                />
            </div>
            <div className="w-1/2 hidden md:block">
                <AdminDropdown
                    className=""
                    profile={profile}
                />
            </div>
        </div>
    );
}
export default BottomNavbar;