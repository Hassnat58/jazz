/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import styles from "./Navbar.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faCog, // Settings icon
  faUser, // User icon
} from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/jazz-logo.png";

const Navbar: React.FC<{ onLOVManagementClick: () => void }> = ({
  onLOVManagementClick,
}) => {
  const [showDropdown, setShowDropdown] = React.useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  // const closeDropdown = () => {
  //   setShowDropdown(false);
  // };
  return (
    <div className={styles.navbar}>
      {/* Jazz logo */}
      <img src={logo} alt="Jazz Logo" className={styles.logo} />

      {/* Search box */}
      <div className={styles.searchBar}>
        <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
        <input type="text" placeholder="Search" />
      </div>

      {/* Right-side icons */}
      <div className={styles.navIcons}>
        {/* User icon */}
        <FontAwesomeIcon icon={faUser} className={styles.icon} />

        {/* Admin Dropdown */}
        <div className={styles.dropdown}>
          <button className={styles.adminBtn} onClick={toggleDropdown}>
            ADMIN ▾
          </button>

          {showDropdown && (
            <div className={styles["dropdown-menu"]}>
              <div
                className={styles["dropdown-item"]}
                onClick={() => {
                  onLOVManagementClick();
                  setShowDropdown(false);
                }}
              >
                <FontAwesomeIcon
                  icon={faCog}
                  className={styles["dropdown-icon"]}
                />
                LOV Management
              </div>
              <div className={styles["dropdown-item"]}>
                <FontAwesomeIcon
                  icon={faUser}
                  className={styles["dropdown-icon"]}
                />
                Manage Roles
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
