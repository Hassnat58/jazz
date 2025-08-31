/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import styles from "./Navbar.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCog, faUser } from "@fortawesome/free-solid-svg-icons";
import logo from "../assets/jazz-logo.png";
import { spfi, SPFx } from "@pnp/sp";

const Navbar: React.FC<{
  onLOVManagementClick: () => void;
  onManageRoleClick: () => void;
  SpfxContext?: any;
}> = ({ onLOVManagementClick, onManageRoleClick, SpfxContext }) => {
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [userPhoto, setUserPhoto] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const sp = spfi().using(SPFx(SpfxContext));

        // Get current user
        const currentUser = await sp.web.currentUser();

        // ✅ Get user photo URL
        const photoUrl = `${SpfxContext.pageContext.web.absoluteUrl}/_layouts/15/userphoto.aspx?accountname=${currentUser.Email}&size=M`;
        setUserPhoto(photoUrl);

        // ✅ Check admin role
        const roles = await sp.web.lists
          .getByTitle("Role")
          .items.filter(`Person/Id eq ${currentUser.Id}`)
          .select("Role", "Person/Id")
          .expand("Person")();

        const hasAdminRole = roles.some((r: any) => r.Role === "Admin");
        setIsAdmin(hasAdminRole);
      } catch (err) {
        console.error("Error loading user info:", err);
      }
    };

    loadUserInfo();
  }, [SpfxContext]);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

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
        {/* ✅ Show user photo instead of icon */}
        {userPhoto ? (
          <img src={userPhoto} alt="User" className={styles.userPhoto} />
        ) : (
          <FontAwesomeIcon icon={faUser} className={styles.icon} />
        )}

        {isAdmin && (
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
                <div
                  className={styles["dropdown-item"]}
                  onClick={() => {
                    onManageRoleClick();
                    setShowDropdown(false);
                  }}
                >
                  <FontAwesomeIcon
                    icon={faUser}
                    className={styles["dropdown-icon"]}
                  />
                  Manage Roles
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
