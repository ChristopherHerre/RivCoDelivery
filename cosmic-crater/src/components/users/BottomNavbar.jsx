import AdminDropdown from '../restaurants/AdminDropdown';

function BottomNavbar(props) {
    const profile = props.profile;
    return (
        <div id="bottom-navbar" className="row">
            <div className="col-12 d-md-none">
                <AdminDropdown 
                    className="mr-1" 
                    profile={profile} 
                    full={1}
                />
            </div>
            <div class="dropdown-divider"></div>
            <div className="col-6 d-none d-md-block">
                <AdminDropdown
                    className="mr-1"
                    profile={profile}
                />
            </div>
        </div>
    );
}
export default BottomNavbar;