import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCallback } from "react";

const exact = require("prop-types-exact");
const IWatchList = require("./interfaces/IWatchList");
const IWatchListItem = require("./interfaces/IWatchListItem");
const IWatchListSource = require("./interfaces/IWatchListSource");
const IWatchListType = require("./interfaces/IWatchListType");
const MuiIcon = require("@mui/icons-material").MuiIcon;
const PropTypes = require("prop-types");
const React = require("react");
const useEffect = require("react").useEffect;
const useState = require("react").useState;
const WatchListDetail = require("./WatchListDetail").default;

const WatchList = ({
     archivedVisible,
     BrokenImageIcon,
     CancelIcon,
     demoMode,
     isAdding,
     EditIcon,
     isEditing,
     isLoggedIn,
     newWatchListItemDtlID,
     ratingMax,
     SaveIcon,
     searchTerm,
     setActiveRoute,
     setIsAdding,
     setIsEditing,
     setNewWatchListItemDtlID,
     setWatchList,
     setWatchListLoadingComplete,
     setWatchListLoadingStarted,
     setWatchListSortingComplete,
     stillWatching,
     sourceFilter,
     typeFilter,
     watchList,
     watchListItems,
     watchListLoadingComplete,
     watchListSortColumn,
     watchListSortDirection,
     watchListSortingComplete,
     watchListSources,
     watchListTypes,
}: {
     archivedVisible: boolean;
     BrokenImageIcon: typeof MuiIcon;
     CancelIcon: typeof MuiIcon;
     demoMode: boolean;
     isAdding: boolean;
     EditIcon: typeof MuiIcon;
     isEditing: boolean;
     isLoggedIn: boolean;
     newWatchListItemDtlID: number;
     ratingMax: number;
     SaveIcon: typeof MuiIcon;
     searchTerm: string;
     setActiveRoute: (arg0: string) => void;
     setIsAdding: (arg0: boolean) => void;
     setIsEditing: (arg0: boolean) => void;
     setNewWatchListItemDtlID: (arg0: number) => void;
     setWatchList: (arg0: typeof IWatchList) => void;
     setWatchListLoadingComplete: (arg0: boolean) => void;
     setWatchListLoadingStarted: (arg0: boolean) => void;
     setWatchListSortingComplete: (arg0: boolean) => void;
     stillWatching: boolean;
     sourceFilter: string;
     typeFilter: string;
     watchList: typeof IWatchList;
     watchListItems: typeof IWatchListItem;
     watchListLoadingComplete: boolean;
     watchListSortColumn: string;
     watchListSortDirection: string;
     watchListSortingComplete: boolean;
     watchListSources: typeof IWatchListSource;
     watchListTypes: typeof IWatchListType;
}) => {
     const [watchListDtlID, setWatchListDtlID] = useState(null);

     const openDetailClickHandler = useCallback(
          (watchListID: number) => {
               if (watchListID !== null) {
                    if (watchListID === -1) {
                         setIsAdding(true);
                    }

                    setWatchListDtlID(watchListID);
               }
          },
          [setIsAdding]
     );

     const showDefaultSrc = (watchListID: number) => (): void => {
          const newWatchList = Object.assign([], watchList);

          const currentWatchListResult = newWatchList?.filter(
               (currentWatchList: typeof IWatchList) => {
                    return String(currentWatchList.WatchListID) === String(watchListID);
               }
          );

          if (currentWatchListResult === 0) {
               // this shouldn't ever happen!
               return;
          }

          const currentWatchList = currentWatchListResult[0];

          currentWatchList["IMDB_Poster_Error"] = true;

          setWatchList(newWatchList);
     };

     useEffect(() => {
          if (watchListDtlID === null && newWatchListItemDtlID !== null) {
               openDetailClickHandler(-1);
          }
     }, [newWatchListItemDtlID, openDetailClickHandler, watchListDtlID]);

     useEffect(() => {
          if (!watchListSortingComplete && watchListLoadingComplete) {
               const newWatchList = Object.assign([], watchList);

               newWatchList.sort((a: typeof IWatchList, b: typeof IWatchList) => {
                    switch (watchListSortColumn) {
                         case "ID":
                              return parseInt(a.WatchListID) > parseInt(b.WatchListID)
                                   ? watchListSortDirection === "ASC"
                                        ? 1
                                        : -1
                                   : watchListSortDirection === "ASC"
                                        ? -1
                                        : 1;
                         case "Name":
                              const aName = a.WatchListItem.WatchListItemName;
                              const bName = b.WatchListItem.WatchListItemName;

                              return String(aName) > String(bName)
                                   ? watchListSortDirection === "ASC"
                                        ? 1
                                        : -1
                                   : watchListSortDirection === "ASC"
                                        ? -1
                                        : 1;
                         case "StartDate":
                              return parseFloat(new Date(a.StartDate).valueOf().toString()) >
                                   parseFloat(new Date(b.StartDate).valueOf().toString())
                                   ? watchListSortDirection === "ASC"
                                        ? 1
                                        : -1
                                   : watchListSortDirection === "ASC"
                                        ? -1
                                        : 1;
                         case "EndDate":
                              return parseFloat(new Date(a.EndDate).valueOf().toString()) >
                                   parseFloat(new Date(b.EndDate).valueOf().toString())
                                   ? watchListSortDirection === "ASC"
                                        ? 1
                                        : -1
                                   : watchListSortDirection === "ASC"
                                        ? -1
                                        : 1;
                    }
               });

               setWatchList(newWatchList);
               setWatchListSortingComplete(true);
          }
     }, [setWatchList, setWatchListSortingComplete, watchList, watchListLoadingComplete, watchListSortColumn, watchListSortDirection, watchListSortingComplete]);

     return (
          <>
               {/* The container for the menuBar */}
               <div className="flex sticky w-screen bg-background/80 backdrop-blur-md gap-4 justify-between items-center px-4 py-6 z-10">
                    {/* The screen title */}
                    <div className="text-3xl md:text-4xl font-bold text-foreground w-full">
                         Recents
                    </div>
                    {isLoggedIn && (
                         <Button className="" onClick={() => openDetailClickHandler(-1)}>
                              Add New <Plus className="ml-1 w-4 h-4" />
                         </Button>
                    )}
               </div>
               <div className="item-list p-4">
                    <ul className="clickable grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
                         {watchList
                              ?.filter(
                                   (currentWatchList: typeof IWatchList) =>
                                        currentWatchList?.Archived === archivedVisible &&
                                        (searchTerm === "" ||
                                             (searchTerm !== "" &&
                                                  currentWatchList?.WatchListItem.WatchListItemName.toLowerCase().includes(
                                                       searchTerm
                                                  ))) &&
                                        ((stillWatching === false &&
                                             (currentWatchList?.EndDate !== null ||
                                                  (currentWatchList?.EndDate === null &&
                                                       currentWatchList?.Archived === true))) ||
                                             (stillWatching == true &&
                                                  currentWatchList?.EndDate === null &&
                                                  currentWatchList?.Archived === archivedVisible)) &&
                                        (sourceFilter === "-1" ||
                                             sourceFilter === null ||
                                             (sourceFilter !== "-1" &&
                                                  sourceFilter !== null &&
                                                  String(currentWatchList?.WatchListSourceID) ===
                                                  String(sourceFilter))) &&
                                        (typeFilter === "-1" ||
                                             (typeFilter !== "-1" &&
                                                  String(currentWatchList?.WatchListTypeID) ===
                                                  String(typeFilter)))
                              )
                              .map((currentWatchList: typeof IWatchList, index: number) => {
                                   return (
                                        <React.Fragment key={index}>
                                             {watchListSortingComplete && (
                                                  <li className="item-card shadow-md transition hover:scale-105" key={index}>
                                                       {/* <span className="item-id">
                      <div>{currentWatchList?.WatchListID}</div>
                    </span> */}

                                                       <a
                                                            className="show-link"
                                                            onClick={() =>
                                                                 openDetailClickHandler(currentWatchList?.WatchListID)
                                                            }
                                                       >
                                                            <div className="">
                                                                 {currentWatchList?.WatchListItem?.IMDB_Poster !==
                                                                      null &&
                                                                      currentWatchList?.IMDB_Poster_Error !== true && (
                                                                           <img
                                                                                alt={
                                                                                     currentWatchList?.WatchListItem
                                                                                          ?.WatchListItemName
                                                                                }
                                                                                src={currentWatchList?.WatchListItem?.IMDB_Poster}
                                                                                onError={() =>
                                                                                     showDefaultSrc(currentWatchList?.WatchListID)
                                                                                }
                                                                                className="aspect-[4/6]"
                                                                           />
                                                                      )}

                                                                 {(currentWatchList?.WatchListItem?.IMDB_Poster ===
                                                                      null ||
                                                                      currentWatchList?.IMDB_Poster_Error === true) && (
                                                                           <>{BrokenImageIcon}</>
                                                                      )}
                                                            </div>
                                                       </a>

                                                       <div className="text-center m-1 w-full">
                                                            {typeof currentWatchList?.WatchListItem.IMDB_URL !==
                                                                 "undefined" && (
                                                                      <a
                                                                           href={currentWatchList?.WatchListItem.IMDB_URL}
                                                                           target="_blank"
                                                                           className="font-medium"
                                                                      >
                                                                           {currentWatchList?.WatchListItem?.WatchListItemName}
                                                                      </a>
                                                                 )}

                                                            {typeof currentWatchList?.WatchListItem?.IMDB_URL ===
                                                                 "undefined" && (
                                                                      <span>
                                                                           {currentWatchList?.WatchListItem?.WatchListItemName}
                                                                      </span>
                                                                 )}

                                                            {currentWatchList?.Archived === true ? (
                                                                 <span>&nbsp;(A)</span>
                                                            ) : (
                                                                 <></>
                                                            )}
                                                       </div>

                                                       {currentWatchList?.WatchListItem?.WatchListType
                                                            ?.WatchListTypeID === 2 && (
                                                                 <div>Season {currentWatchList?.Season}</div>
                                                            )}

                                                       <div className="text-sm w-full text-center text-muted-foreground">
                                                            {currentWatchList?.StartDate}
                                                            {currentWatchList?.EndDate !== null &&
                                                                 currentWatchList?.EndDate !== currentWatchList?.StartDate
                                                                 ? ` - ${currentWatchList?.EndDate}`
                                                                 : ""}
                                                       </div>

                                                       <div>
                                                            {
                                                                 currentWatchList?.WatchListItem?.WatchListType
                                                                      ?.WatchListTypeName
                                                            }
                                                       </div>

                                                       <div>
                                                            {currentWatchList?.WatchListSource?.WatchListSourceName}
                                                       </div>

                                                       {currentWatchList?.Rating !== null && (
                                                            <div>
                                                                 {currentWatchList?.Rating}/{ratingMax}
                                                            </div>
                                                       )}
                                                  </li>
                                             )}
                                        </React.Fragment>
                                   );
                              })}
                    </ul>
               </div>

               {watchListDtlID !== null && (
                    <WatchListDetail
                         BrokenImageIcon={BrokenImageIcon}
                         CancelIcon={CancelIcon}
                         demoMode={demoMode}
                         EditIcon={EditIcon}
                         isAdding={isAdding}
                         isEditing={isEditing}
                         newWatchListItemDtlID={newWatchListItemDtlID}
                         ratingMax={ratingMax}
                         SaveIcon={SaveIcon}
                         setActiveRoute={setActiveRoute}
                         setIsAdding={setIsAdding}
                         setIsEditing={setIsEditing}
                         setNewWatchListItemDtlID={setNewWatchListItemDtlID}
                         setWatchListDtlID={setWatchListDtlID}
                         setWatchListLoadingStarted={setWatchListLoadingStarted}
                         setWatchListLoadingComplete={setWatchListLoadingComplete}
                         setWatchListSortingComplete={setWatchListSortingComplete}
                         watchListDtlID={watchListDtlID}
                         watchListItems={watchListItems}
                         watchListSortDirection={watchListSortDirection}
                         watchListSources={watchListSources}
                         watchListTypes={watchListTypes}
                    />
               )}
          </>
     );
};

WatchList.propTypes = exact({
     archivedVisible: PropTypes.bool.isRequired,
     BrokenImageIcon: PropTypes.object.isRequired,
     CancelIcon: PropTypes.object.isRequired,
     demoMode: PropTypes.bool.isRequired,
     isAdding: PropTypes.bool.isRequired,
     EditIcon: PropTypes.object.isRequired,
     isEditing: PropTypes.bool.isRequired,
     isLoggedIn: PropTypes.bool.isRequired,
     newWatchListItemDtlID: PropTypes.number,
     ratingMax: PropTypes.number.isRequired,
     SaveIcon: PropTypes.object.isRequired,
     searchTerm: PropTypes.string.isRequired,
     setActiveRoute: PropTypes.func.isRequired,
     setIsAdding: PropTypes.func.isRequired,
     setIsEditing: PropTypes.func.isRequired,
     setNewWatchListItemDtlID: PropTypes.func.isRequired,
     setWatchList: PropTypes.func.isRequired,
     setWatchListLoadingComplete: PropTypes.func.isRequired,
     setWatchListLoadingStarted: PropTypes.func.isRequired,
     setWatchListSortingComplete: PropTypes.func.isRequired,
     stillWatching: PropTypes.bool.isRequired,
     sourceFilter: PropTypes.string.isRequired,
     typeFilter: PropTypes.string.isRequired,
     watchList: PropTypes.array.isRequired,
     watchListItems: PropTypes.array.isRequired,
     watchListLoadingComplete: PropTypes.bool.isRequired,
     watchListSortColumn: PropTypes.string.isRequired,
     watchListSortDirection: PropTypes.string.isRequired,
     watchListSortingComplete: PropTypes.bool.isRequired,
     watchListSources: PropTypes.array.isRequired,
     watchListTypes: PropTypes.array.isRequired,
});

export default WatchList;
