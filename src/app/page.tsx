"use client";

// NOTE: If you run this script in VS Code in Docker, you HAVE to run the web app on port 8080 or websocket will stop working which breaks hot reloading
//
// Known Issues/Future features
//
const axios = require("axios");
const useEffect = require("react").useEffect;
const useState = require("react").useState;
const ISearchImdb = require("./interfaces/ISearchImdb");
const IUser = require("./interfaces/IUser");
const IWatchList = require("./interfaces/IWatchList");
const IWatchListItem = require("./interfaces/IWatchListItem");
const IWatchListSource = require("./interfaces/IWatchListSource");
const IWatchListType = require("./interfaces/IWatchListType");

const React = require("react");

import AdminConsole from "./AdminConsole";
import SearchIMDB from "./SearchIMDB";
import Login from "./Login";
import Settings from "./Settings";
import Setup from "./Setup";
import WatchList from "./WatchList";
import WatchListItems from "./WatchListItems";
import WatchListStats from "./WatchListStats";
import TabParent from "./TabParent";

import "./page.css";
import { useCallback, useMemo } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { BarChart2, CircleUserRound, Cog, Film, HistoryIcon, Search, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ratingMax = 5;

const AddIcon = require("@mui/icons-material/Add").default;
const AddIconComponent = <AddIcon className="icon" />;

const AdminConsoleIconComponent = <CircleUserRound className="w-6 h-6" />;

const BrokenImageIcon = require("@mui/icons-material/BrokenImage").default;
const BrokenImageIconComponent = <BrokenImageIcon className="brokenImage" />;

const CancelIcon = require("@mui/icons-material/Cancel").default;
const CancelIconComponent = <CancelIcon />;

const EditIcon = require("@mui/icons-material/Edit").default;
const EditIconComponent = <EditIcon />;

const LogOutIcon = require("@mui/icons-material/Logout").default;
const LogOutIconComponent = <LogOutIcon className="icon" />;

const SaveIcon = require("@mui/icons-material/Save").default;
const SaveIconComponent = <SaveIcon />;

const SearchIcon = require("@mui/icons-material/Search").default;
const SearchIconComponent = <SearchIcon className="icon" />;


const SettingsIconComponent = <Cog />;

const StatsIconComponent = <BarChart2 className="w-6 h-6" />;

const WatchListIconComponent = <HistoryIcon className="w-6 h-6" />;

const WatchListItemsIconComponent = <Film className="w-6 h-6" />;

export default function Home() {
  const [activeRoute, setActiveRoute] = useState("");
  const [activeRouteDisplayName, setActiveRouteDisplayName] = useState("");
  const [archivedVisible, setArchivedVisible] = useState(false);
  const [autoAdd, setAutoAdd] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggedInCheckComplete, setIsLoggedInCheckComplete] = useState(false);
  const [isLoggedInCheckStarted, setIsLoggedInCheckStarted] = useState(false);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);  // State to control the opening of the dialog
  const [loginVisible, setLoginVisible] = useState(false);
  const [searchCount, setSearchCount] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [setupVisible, setSetupVisible] = useState(false);
  const [showMissingArtwork, setShowMissingArtwork] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("-1");
  const [typeFilter, setTypeFilter] = useState("-1");
  const [stillWatching, setStillWatching] = useState(true);
  const [userData, setUserData] = useState({
    UserID: 0,
    Username: "",
    RealName: "",
    Admin: false,
  }); // cannot use iUserEmpty() here

  const [watchList, setWatchList] = useState([]);
  const [watchListLoadingStarted, setWatchListLoadingStarted] = useState(false);
  const [watchListLoadingComplete, setWatchListLoadingComplete] =
    useState(false);
  const [watchListSortingComplete, setWatchListSortingComplete] =
    useState(false);

  const [watchListItems, setWatchListItems] = useState([]);
  const [watchListItemsLoadingStarted, setWatchListItemsLoadingStarted] =
    useState(false);
  const [watchListItemsLoadingComplete, setWatchListItemsLoadingComplete] =
    useState(false);
  const [watchListItemsSortingComplete, setWatchListItemsSortingComplete] =
    useState(false);

  const [newWatchListItemDtlID, setNewWatchListItemDtlID] = useState(null); // After adding a new WLI, This will hold the new ID so it can be passed to WatchList and add a new record based on this WLI ID

  const [watchListSources, setWatchListSources] = useState([]);
  const [watchListSourcesLoadingStarted, setWatchListSourcesLoadingStarted] =
    useState(false);
  const [watchListSourcesLoadingComplete, setWatchListSourcesLoadingComplete] =
    useState(false);

  const [watchListTypes, setWatchListTypes] = useState([]);
  const [watchListTypesLoadingStarted, setWatchListTypesLoadingStarted] =
    useState(false);
  const [watchListTypesLoadingComplete, setWatchListTypesLoadingComplete] =
    useState(false);

  const [watchListSortColumn, setWatchListSortColumn] = useState("Name");
  const [watchListSortDirection, setWatchListSortDirection] = useState("ASC");

  const defaultRoute = "WatchList";
  const demoUsername = "demo";
  const demoPassword = "demo";

  const watchListSortColumns = {
    ID: "ID",
    Name: "Name",
    StartDate: "Start Date",
    EndDate: "End Date",
  };

  const watchListItemsSortColumns = useMemo(() => {
    return {
      ID: "ID",
      Name: "Name",
    };
  }, []);

  const generateRandomPassword = () => {
    const lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
    const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const digitChars = "0123456789";
    const specialChars = "!@#$%^&*";
    const allChars =
      lowercaseChars + uppercaseChars + digitChars + specialChars;

    let randomString = "";

    // Add one character from each character set to satisfy the regex
    randomString +=
      lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    randomString +=
      uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    randomString += digitChars[Math.floor(Math.random() * digitChars.length)];
    randomString +=
      specialChars[Math.floor(Math.random() * specialChars.length)];

    // Fill the rest of the string with random characters
    while (randomString.length < 8) {
      randomString += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return randomString;
  };

  const isLoggedInCheck = useCallback(() => {
    if (isLoggedInCheckComplete == false) return false;

    if (isLoggedInCheckComplete && !isLoggedIn) return false;

    return true;
  }, [isLoggedIn, isLoggedInCheckComplete]);

  const showSearch = () => {
    setSearchVisible(true);
  };

  const showSettings = () => {
    setSettingsVisible(true);
  };

  const signOut = () => {
    if (demoMode) {
      signOutActions();
      return;
    }

    axios
      .get(`/api/SignOut`)
      .then((res: typeof IUser) => {
        if (res.data[0] === "OK") {
          signOutActions();
        } else {
          alert(res.data[1]);
        }
      })
      .catch((err: Error) => {
        alert(err.message);
      });
  };

  const signOutActions = () => {
    const newUserData = Object.assign({}, userData);
    newUserData.UserID = "";
    newUserData.Username = "";
    newUserData.RealName = "";

    setUserData(newUserData);

    setIsLoggedIn(false);

    setActiveRoute("");
    setActiveRouteDisplayName("");
    setIsAdding(false);
    setIsEditing(false);
    setIsLoggedIn(false);
    setIsLoggedInCheckComplete(false);
    setSearchTerm("");
    setSourceFilter("-1");
    setTypeFilter("-1");

    setWatchList([]);
    setWatchListLoadingStarted(false);
    setWatchListLoadingComplete(false);

    setWatchListItems([]);
    setWatchListItemsLoadingStarted(false);
    setWatchListLoadingComplete(false);

    setWatchListSources([]);
    setWatchListSourcesLoadingStarted(false);
    setWatchListSourcesLoadingComplete(false);

    setWatchListTypes([]);
    setWatchListTypesLoadingStarted(false);
    setWatchListTypesLoadingComplete(false);

    setSettingsVisible(false);

    localStorage.removeItem("watchlist_demomode");

    setActiveRoute("Login");
  };

  // Function to toggle the dialog's open state
  const toggleSearchDialog = () => setIsSearchDialogOpen(!isSearchDialogOpen);

  const validatePassword = (value: string) => {
    // 1 lowercase alphabetical character, 1 uppercase alphabetical character, 1 numeric, 1 special char, 8 chars long minimum
    const strongRegex = new RegExp(
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})"
    );

    return strongRegex.test(value);
  };

  // Check if user is logged in already
  useEffect(() => {
    setIsLoggedInCheckStarted(true);

    if (!isLoggedIn && !isLoggedInCheckStarted) {
      const newArchivedVisible = localStorage.getItem(
        "WatchList.ArchivedVisible"
      );
      const newAutoAdd = localStorage.getItem("WatchList.AutoAdd");
      const newSearchCount = localStorage.getItem("WatchList.SearchCount");
      const newStillWatching = localStorage.getItem("WatchList.StillWatching");
      const newShowMissingArtwork = localStorage.getItem(
        "WatchList.ShowMissingArtwork"
      );
      const newSourceFilter = localStorage.getItem("WatchList.SourceFilter");
      const newTypeFilter = localStorage.getItem("WatchList.TypeFilter");
      const newSortColumn = localStorage.getItem(
        "WatchList.WatchListSortColumn"
      );
      const newSortDirection = localStorage.getItem(
        "WatchList.WatchListSortDirection"
      );

      if (newArchivedVisible !== null) {
        setArchivedVisible(newArchivedVisible === "true" ? true : false);
      }

      if (newAutoAdd !== null) {
        setAutoAdd(newAutoAdd === "true" ? true : false);
      }

      if (newSearchCount !== null) {
        setSearchCount(parseInt(newSearchCount, 10));
      }

      if (newShowMissingArtwork !== null) {
        setShowMissingArtwork(newShowMissingArtwork === "true" ? true : false);
      }

      if (newStillWatching !== null) {
        setStillWatching(newStillWatching === "true" ? true : false);
      }

      if (newSourceFilter !== null) {
        setSourceFilter(newSourceFilter);
      }

      if (newTypeFilter !== null) {
        setTypeFilter(newTypeFilter);
      }

      if (newSortColumn !== null) {
        setWatchListSortColumn(newSortColumn);
      }

      if (newSortDirection !== null) {
        setWatchListSortDirection(newSortDirection);
      }

      if (isLoggedInCheckStarted) {
        return;
      }

      const previousDemoMode = localStorage.getItem("watchlist_demomode");

      if (previousDemoMode === "true") {
        setDemoMode(true);

        const newUserData = require("./demo/index").demoUser[0];

        setUserData(newUserData);

        setIsLoggedIn(true);

        setLoginVisible(false);

        setActiveRoute("WatchList");

        setIsLoggedInCheckComplete(true);

        return;
      }

      axios
        .get(`/api/IsLoggedIn`)
        .then((res: typeof IUser) => {
          if (res.data[0] === "OK") {
            const newUserData = Object.assign({}, userData);
            newUserData.UserID = res.data[1].UserID;
            newUserData.Username = res.data[1].Username;
            newUserData.RealName = res.data[1].RealName;
            newUserData.Admin = res.data[1].Admin === 1 ? true : false;

            setUserData(newUserData);

            setIsLoggedIn(true);

            setLoginVisible(false);

            setActiveRoute("WatchList");
          } else {
            if (res.data[1] === false) {
              setSetupVisible(true);
            }

            setIsLoggedIn(false);
            setLoginVisible(true);
          }

          setIsLoggedInCheckComplete(true);
        })
        .catch((err: Error) => {
          alert(
            new Date().toTimeString() +
              ": Error when calling /IsLoggedIn with the error " +
              err.message
          );
          setIsLoggedInCheckComplete(true);
          setLoginVisible(true);
        });
    } else if (isLoggedIn) {
      setIsLoggedInCheckComplete(true);
    } else {
      setIsLoggedInCheckComplete(true);
    }
  }, [isLoggedIn, isLoggedInCheckStarted, userData]);

  // Get WatchList
  useEffect(() => {
    if (!isLoggedInCheck()) return;

    if (demoMode) {
      const demoWatchListPayload = require("./demo/index").demoWatchListPayload;

      setWatchList(demoWatchListPayload);
      setWatchListLoadingStarted(true);
      setWatchListLoadingComplete(true);

      return;
    }

    if (!watchListLoadingStarted && !watchListLoadingComplete) {
      setWatchListLoadingStarted(true);

      axios
        .get(
          `/api/GetWatchList?SortColumn=${watchListSortColumn}&SortDirection=${watchListSortDirection}`,
          { withCredentials: true }
        )
        .then((res: typeof IWatchList) => {
          setWatchList(res.data);
          setWatchListLoadingComplete(true);
        })
        .catch((err: Error) => {
          alert("Failed to get WatchList with the error " + err.message);
        });
    }
  }, [
    isLoggedInCheck,
    isLoggedIn,
    userData,
    watchListLoadingStarted,
    watchListLoadingComplete,
    watchListSortColumn,
    watchListSortDirection,
  ]);

  // Get WatchListItems
  useEffect(() => {
    if (!isLoggedInCheck()) return;

    if (demoMode) {
      const demoWatchListItemsPayload =
        require("./demo/index").demoWatchListItemsPayload;

      setWatchListItems(demoWatchListItemsPayload);
      setWatchListItemsLoadingStarted(true);
      setWatchListItemsLoadingComplete(true);

      return;
    }

    if (
      watchListLoadingComplete &&
      !watchListItemsLoadingStarted &&
      !watchListItemsLoadingComplete
    ) {
      setWatchListItemsLoadingStarted(true);

      axios
        .get(
          `/api/GetWatchListItems${
            Object.keys(watchListItemsSortColumns).includes(watchListSortColumn)
              ? `?SortColumn=${watchListSortColumn}&SortDirection=${watchListSortDirection}`
              : ``
          }`,
          { withCredentials: true }
        )
        .then((res: typeof IWatchListItem) => {
          setWatchListItems(res.data);
          setWatchListItemsLoadingComplete(true);
          setWatchListItemsSortingComplete(false);

          if (autoAdd && newWatchListItemDtlID !== null) {
            setActiveRoute(defaultRoute);
          }
        })
        .catch((err: Error) => {
          alert("Failed to get WatchList Items with the error " + err.message);
        });
    }
  }, [
    autoAdd,
    isLoggedInCheck,
    isLoggedInCheckComplete,
    isLoggedIn,
    newWatchListItemDtlID,
    watchListLoadingComplete,
    watchListItemsLoadingStarted,
    watchListItemsLoadingComplete,
    watchListItemsSortColumns,
    watchListSortColumn,
    watchListSortDirection,
  ]);

  // Get WatchListSources
  useEffect(() => {
    if (!isLoggedInCheck()) return;

    if (demoMode) {
      const demoWatchListSourcesPayload =
        require("./demo/index").demoWatchListSources;

      setWatchListSources(demoWatchListSourcesPayload);
      setWatchListSourcesLoadingStarted(true);
      setWatchListSourcesLoadingComplete(true);

      return;
    }

    if (
      watchListItemsLoadingComplete &&
      !watchListSourcesLoadingStarted &&
      !watchListSourcesLoadingComplete
    ) {
      setWatchListSourcesLoadingStarted(true);

      axios
        .get(`/api/GetWatchListSources`, { withCredentials: true })
        .then((res: typeof IWatchListSource) => {
          res.data.sort(
            (a: typeof IWatchListSource, b: typeof IWatchListSource) => {
              const aName = a.WatchListSourceName;
              const bName = b.WatchListSourceName;

              return String(aName) > String(bName) ? 1 : -1;
            }
          );

          setWatchListSources(res.data);
          setWatchListSourcesLoadingComplete(true);
        })
        .catch((err: Error) => {
          alert(
            "Failed to get WatchList Sources with the error " + err.message
          );
        });
    }
  }, [
    isLoggedInCheck,
    isLoggedInCheckComplete,
    isLoggedIn,
    watchListItemsLoadingComplete,
    watchListSourcesLoadingStarted,
    watchListSourcesLoadingComplete,
  ]);

  // Get WatchListTypes
  useEffect(() => {
    if (!isLoggedInCheck()) return;

    if (demoMode) {
      const demoWatchListTypesPayload =
        require("./demo/index").demoWatchListTypes;

      setWatchListTypes(demoWatchListTypesPayload);
      setWatchListTypesLoadingStarted(true);
      setWatchListTypesLoadingComplete(true);

      return;
    }

    if (
      watchListSourcesLoadingComplete &&
      !watchListTypesLoadingStarted &&
      !watchListTypesLoadingComplete
    ) {
      setWatchListTypesLoadingStarted(true);

      axios
        .get(`/api/GetWatchListTypes`, { withCredentials: true })
        .then((res: typeof IWatchListType) => {
          setWatchListTypes(res.data);
          setWatchListTypesLoadingComplete(true);
        })
        .catch((err: Error) => {
          alert("Failed to get WatchList Types with the error " + err.message);
        });
    }
  }, [
    isLoggedInCheck,
    isLoggedInCheckComplete,
    isLoggedIn,
    watchListSourcesLoadingComplete,
    watchListTypesLoadingStarted,
    watchListTypesLoadingComplete,
  ]);

  // Save preferences
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    localStorage.setItem("WatchList.ArchivedVisible", archivedVisible);
    localStorage.setItem("WatchList.AutoAdd", autoAdd);
    localStorage.setItem("WatchList.SearchCount", searchCount);
    localStorage.setItem("WatchList.ShowMissingArtwork", showMissingArtwork);
    localStorage.setItem("WatchList.SourceFilter", sourceFilter);
    localStorage.setItem("WatchList.StillWatching", stillWatching);
    localStorage.setItem("WatchList.TypeFilter", typeFilter);
    localStorage.setItem("WatchList.WatchListSortColumn", watchListSortColumn);
    localStorage.setItem(
      "WatchList.WatchListSortDirection",
      watchListSortDirection
    );

    setWatchListSortingComplete(false);
    setWatchListItemsSortingComplete(false);
  }, [
    archivedVisible,
    autoAdd,
    isLoggedIn,
    searchCount,
    showMissingArtwork,
    stillWatching,
    sourceFilter,
    typeFilter,
    watchListSortColumn,
    watchListSortDirection,
  ]);

  const routeList = {
    WatchList: {
      Name: "WatchList",
      DisplayName: "Recents",
      Path: "/WatchList",
      Icon: WatchListIconComponent,
      RequiresAuth: true,
      Component: (
        <WatchList
          archivedVisible={archivedVisible}
          autoAdd={autoAdd}
          BrokenImageIcon={BrokenImageIconComponent}
          isAdding={isAdding}
          CancelIcon={CancelIconComponent}
          demoMode={demoMode}
          EditIcon={EditIconComponent}
          isEditing={isEditing}
          isLoggedIn={isLoggedIn}
          newWatchListItemDtlID={newWatchListItemDtlID}
          ratingMax={ratingMax}
          SaveIcon={SaveIconComponent}
          searchTerm={searchTerm}
          setActiveRoute={setActiveRoute}
          setIsAdding={setIsAdding}
          setIsEditing={setIsEditing}
          setNewWatchListItemDtlID={setNewWatchListItemDtlID}
          setWatchList={setWatchList}
          setWatchListLoadingComplete={setWatchListLoadingComplete}
          setWatchListLoadingStarted={setWatchListLoadingStarted}
          setWatchListSortingComplete={setWatchListSortingComplete}
          sourceFilter={sourceFilter}
          stillWatching={stillWatching}
          typeFilter={typeFilter}
          watchList={watchList}
          watchListItems={watchListItems}
          watchListLoadingComplete={watchListLoadingComplete}
          watchListSortColumn={watchListSortColumn}
          watchListSortDirection={watchListSortDirection}
          watchListSortingComplete={watchListSortingComplete}
          watchListSources={watchListSources}
          watchListTypes={watchListTypes}
        />
      ),
    },
    /*WatchListItems: {
      Name: "WatchListItems",
      DisplayName: "My List",
      Path: "/WatchListItems",
      Icon: WatchListItemsIconComponent,
      RequiresAuth: true,
      Component: (
        <WatchListItems
          AddIcon={AddIconComponent}
          archivedVisible={archivedVisible}
          BrokenImageIcon={BrokenImageIconComponent}
          CancelIcon={CancelIconComponent}
          demoMode={demoMode}
          EditIcon={EditIconComponent}
          isAdding={isAdding}
          isEditing={isEditing}
          SaveIcon={SaveIconComponent}
          searchTerm={searchTerm}
          setIsAdding={setIsAdding}
          setIsEditing={setIsEditing}
          setNewWatchListItemDtlID={setNewWatchListItemDtlID}
          setWatchListItems={setWatchListItems}
          setWatchListItemsLoadingComplete={setWatchListItemsLoadingComplete}
          setWatchListItemsLoadingStarted={setWatchListItemsLoadingStarted}
          setWatchListItemsSortingComplete={setWatchListItemsSortingComplete}
          setWatchListLoadingComplete={setWatchListLoadingComplete}
          setWatchListLoadingStarted={setWatchListLoadingStarted}
          showMissingArtwork={showMissingArtwork}
          typeFilter={typeFilter}
          watchListCount={watchList.length}
          watchListItems={watchListItems}
          watchListItemsLoadingComplete={watchListItemsLoadingComplete}
          watchListSortColumn={watchListSortColumn}
          watchListSortDirection={watchListSortDirection}
          watchListItemsSortingComplete={watchListItemsSortingComplete}
          watchListTypes={watchListTypes}
        />
      ),
    },*/
    /*SearchIMDB: {
               Name: "SearchIMDB",
               DisplayName: "Search",
               Path: "/SearchIMDB",
               Icon: SearchIconComponent,
               RequiresAuth: true,
               Component: (
                    <SearchIMDB
                         AddIcon={AddIconComponent}
                         autoAdd={autoAdd}
                         BrokenImageIcon={BrokenImageIconComponent}
                         searchCount={searchCount}
                         SearchIcon={SearchIconComponent}
                         setNewWatchListItemDtlID={setNewWatchListItemDtlID}
                         setWatchListItemsLoadingStarted={setWatchListItemsLoadingStarted}
                         setWatchListItemsLoadingComplete={setWatchListItemsLoadingComplete}
                    />
               ),
          },*/
    WatchListStats: {
      Name: "WatchListStats",
      DisplayName: "Stats",
      Path: "/WatchListStats",
      Icon: StatsIconComponent,
      RequiresAuth: true,
      Component: (
        <WatchListStats
          demoMode={demoMode}
          isLoggedIn={isLoggedIn}
          isLoggedInCheckComplete={isLoggedInCheckComplete}
          ratingMax={ratingMax}
        />
      ),
    },
    AdminConsole: {
      Name: "AdminConsole",
      DisplayName: "Admin",
      Path: "/AdminConsole",
      Icon: AdminConsoleIconComponent,
      RequiresAuth: true,
      Component: (
        <AdminConsole
          CancelIcon={CancelIcon}
          demoMode={demoMode}
          EditIcon={EditIcon}
          generateRandomPassword={generateRandomPassword}
          SaveIcon={SaveIcon}
          setWatchListSources={setWatchListSources}
          setWatchListSourcesLoadingStarted={setWatchListSourcesLoadingStarted}
          setWatchListSourcesLoadingComplete={
            setWatchListSourcesLoadingComplete
          }
          setWatchListTypes={setWatchListTypes}
          setWatchListTypesLoadingStarted={setWatchListTypesLoadingStarted}
          setWatchListTypesLoadingComplete={setWatchListTypesLoadingComplete}
          validatePassword={validatePassword}
          watchListSources={watchListSources}
          watchListTypes={watchListTypes}
        />
      ),
    },
    Login: {
      Name: "Login",
      DisplayName: "Login",
      Path: "/Login",
      RequiresAuth: false,
      Component: (
        <Login
          demoUsername={demoUsername}
          demoPassword={demoPassword}
          defaultRoute={defaultRoute}
          setIsLoggedIn={setIsLoggedIn}
          setActiveRoute={setActiveRoute}
          setDemoMode={setDemoMode}
          setIsLoggedInCheckComplete={setIsLoggedInCheckComplete}
          setUserData={setUserData}
        />
      ),
    },
  };

  return (
    <>
      <div className="flex justify-between items-center px-4 py-2 w-full border-b border-border">

      <div className="text-xl font-bold text-foreground">
                  Watch<span className="text-muted-foreground">List</span>
                </div>
        <div className="flex items-center gap-4">
        <SearchIMDB
              // DOESNT APPEAR TO BE USED IN SEARCHIMDB isDialogOpen={isSearchDialogOpen}
              // DOESNT APPEAR TO BE USED IN SEARCHIMDB setIsDialogOpen={setIsSearchDialogOpen}
                autoAdd={autoAdd}
                BrokenImageIcon={BrokenImageIconComponent}
                searchCount={searchCount}
                setNewWatchListItemDtlID={setNewWatchListItemDtlID}
                setSearchVisible={setSearchVisible}
                setWatchListItemsLoadingStarted={setWatchListItemsLoadingStarted}
                setWatchListItemsLoadingComplete={setWatchListItemsLoadingComplete}/>

          <span className="clickable" >
          <Button variant="outline" size="icon" onClick={toggleSearchDialog}>
              <Settings2/>
              </Button>

              

            
          </span>
          <ModeToggle/>
        </div>
      </div>

      {isLoggedIn &&
        watchListSourcesLoadingComplete &&
        watchListTypesLoadingComplete && (
          <>
            <>


              <TabParent
                activeRoute={activeRoute}
                admin={userData.Admin}
                defaultRoute={defaultRoute}
                isLoggedIn={isLoggedIn}
                isLoggedInCheckComplete={isLoggedInCheckComplete}
                routeList={routeList}
                setActiveRoute={setActiveRoute}
                setActiveRouteDisplayName={setActiveRouteDisplayName}
              />
            </>

            {/*{searchVisible && (
              <SearchIMDB
                autoAdd={autoAdd}
                BrokenImageIcon={BrokenImageIconComponent}
                searchCount={searchCount}
                setNewWatchListItemDtlID={setNewWatchListItemDtlID}
                setSearchVisible={setSearchVisible}
                setWatchListItemsLoadingStarted={
                  setWatchListItemsLoadingStarted
                }
                setWatchListItemsLoadingComplete={
                  setWatchListItemsLoadingComplete
                }
              />
              )}*/}

            {settingsVisible && (
              <Settings
                activeRoute={activeRoute}
                archivedVisible={archivedVisible}
                autoAdd={autoAdd}
                isLoggedIn={isLoggedIn}
                LogOutIconComponent={LogOutIconComponent}
                searchCount={searchCount}
                searchTerm={searchTerm}
                setAutoAdd={setAutoAdd}
                setSearchTerm={setSearchTerm}
                setSettingsVisible={setSettingsVisible}
                stillWatching={stillWatching}
                setArchivedVisible={setArchivedVisible}
                setSearchCount={setSearchCount}
                setShowMissingArtwork={setShowMissingArtwork}
                setSourceFilter={setSourceFilter}
                setStillWatching={setStillWatching}
                setTypeFilter={setTypeFilter}
                setWatchListSortColumn={setWatchListSortColumn}
                setWatchListSortDirection={setWatchListSortDirection}
                showMissingArtwork={showMissingArtwork}
                signOut={signOut}
                sourceFilter={sourceFilter}
                typeFilter={typeFilter}
                watchListItemsSortColumns={watchListItemsSortColumns}
                watchListSortColumn={watchListSortColumn}
                watchListSortColumns={watchListSortColumns}
                watchListSortDirection={watchListSortDirection}
                watchListSources={watchListSources}
                watchListTypes={watchListTypes}
              />
            )}
          </>
        )}

      {!isLoggedIn && (
        <>
          {loginVisible && !setupVisible && <>{routeList["Login"].Component}</>}

          {setupVisible && !loginVisible && (
            <Setup
              demoUsername={demoUsername}
              setSetupVisible={setSetupVisible}
              validatePassword={validatePassword}
            />
          )}
        </>
      )}
    </>
  );
}
