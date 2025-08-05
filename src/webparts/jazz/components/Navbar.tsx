import * as React from "react";
import styles from "./Navbar.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  // faCommentDots,
  // faBell,
  // faTh,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/jazz-logo (1).png";
const Navbar: React.FC = () => {
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
        {/* <FontAwesomeIcon icon={faCommentDots} className={styles.icon} />
        <div className={styles.notificationWrapper}>
          <FontAwesomeIcon icon={faBell} className={styles.icon} />
          <span className={styles.badge}>2</span>
        </div>
        <FontAwesomeIcon icon={faTh} className={styles.icon} /> */}
        <FontAwesomeIcon icon={faUser} className={styles.icon} />

        {/* Admin Button */}
        <button className={styles.adminBtn}>ADMIN</button>
      </div>
    </div>
  );
};

export default Navbar;
