import React, { useState } from 'react';
import { Menu, MenuItem, Button, ListItemIcon, ListItemText } from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import HelpIcon from '@mui/icons-material/Help';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsApplicationsIcon from '@mui/icons-material/SettingsApplications';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { Link } from 'react-router-dom';

function AdminDropdown({ profile, full }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <div>
      <Button
        variant="contained"
        color="secondary"
        onClick={handleClick}
        startIcon={<SettingsApplicationsIcon />}
        sx={{ mb: 1 }}
      >
        Admin Menu
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: { bgcolor: '#212121', color: '#fff' } }}
      >
        {profile && (
          <>
            <MenuItem component={Link} to="/users" onClick={handleClose}>
              <ListItemIcon>
                <PeopleIcon sx={{ color: '#fff' }} />
              </ListItemIcon>
              <ListItemText primary="User Management" />
            </MenuItem>
            <MenuItem component={Link} to="/admin" onClick={handleClose}>
              <ListItemIcon>
                <SettingsApplicationsIcon sx={{ color: '#fff' }} />
              </ListItemIcon>
              <ListItemText primary="Restaurant Control Panel" />
            </MenuItem>
            <MenuItem component={Link} to="/orders" onClick={handleClose}>
              <ListItemIcon>
                <LocalShippingIcon sx={{ color: '#fff' }} />
              </ListItemIcon>
              <ListItemText primary="Driver Orders" />
            </MenuItem>
          </>
        )}
      </Menu>
      <Button
        component={Link}
        to="/donate"
        variant="contained"
        color="primary"
        startIcon={<CreditCardIcon />}
        sx={{ mt: 1, bgcolor: '#1976d2', color: '#fff', '&:hover': { bgcolor: '#115293' } }}
        
      >
        Donate
      </Button>
    </div>
  );
}

export default AdminDropdown;