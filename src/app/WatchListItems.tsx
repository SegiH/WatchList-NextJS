import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const exact = require("prop-types-exact");
const IWatchListItem = require("./interfaces/IWatchListItem");
const IWatchListSortColumn = require("./interfaces/IWatchListSortColumn");
const IWatchListType = require("./interfaces/IWatchListType");
const MuiIcon = require("@mui/icons-material").MuiIcon;
const PropTypes = require("prop-types");
const React = require("react");
const useEffect = require("react").useEffect;
const useState = require("react").useState;
const WatchListItemDetail = require("./WatchListItemDetail").default;

const WatchListItems = ({ AddIcon, archivedVisible, BrokenImageIcon, CancelIcon, demoMode, isAdding, EditIcon, isEditing, SaveIcon, searchTerm, setIsAdding, setIsEditing, setNewWatchListItemDtlID, setWatchListItems, setWatchListItemsLoadingComplete, setWatchListItemsLoadingStarted, setWatchListItemsSortingComplete, setWatchListLoadingComplete, setWatchListLoadingStarted, showMissingArtwork, typeFilter, watchListCount, watchListItems, watchListItemsLoadingComplete, watchListItemsSortingComplete, watchListSortColumn, watchListSortDirection, watchListTypes }
     :
     {
          AddIcon: typeof MuiIcon,
          archivedVisible: boolean,
          BrokenImageIcon: typeof MuiIcon,
          CancelIcon: typeof MuiIcon,
          demoMode: boolean,
          isAdding: boolean,
          EditIcon: typeof MuiIcon,
          isEditing: boolean,
          SaveIcon: typeof MuiIcon,
          searchTerm: string,
          setIsAdding: (arg0: boolean) => void,
          setIsEditing: (arg0: boolean) => void,
          setNewWatchListItemDtlID: (arg0: number) => void,
          setWatchListItems: (arg0: typeof IWatchListItem) => void,
          setWatchListItemsLoadingComplete: (arg0: boolean) => void,
          setWatchListItemsLoadingStarted: (arg0: boolean) => void,
          setWatchListItemsSortingComplete: (arg0: boolean) => void,
          setWatchListLoadingComplete: (arg0: boolean) => void,
          setWatchListLoadingStarted: (arg0: boolean) => void,
          showMissingArtwork: boolean,
          typeFilter: string,
          watchListCount: number,
          watchListItems: typeof IWatchListItem,
          watchListItemsLoadingComplete: boolean,
          watchListSortColumn: string,
          watchListSortDirection: string,
          watchListItemsSortingComplete: boolean,
          watchListTypes: typeof IWatchListType
     }) => {
     const [watchListItemDtlID, setWatchListItemDtlID] = useState(null);

     const openDetailClickHandler = (watchListItemID: number) => {
          if (watchListItemID !== null) {
               if (watchListItemID === -1) {
                    setIsAdding(true);
               }

               setWatchListItemDtlID(watchListItemID);
          }
     };

     const setImageLoaded = (watchListItemID: number) => (): void => {
          const newWatchListItems: typeof IWatchListItem = Object.assign(typeof WatchListItems, watchListItems);

          const currentWatchListItemsResult = newWatchListItems?.filter((currentWatchListItems: typeof IWatchListItem) => {
               return String(currentWatchListItems.WatchListItemID) === String(watchListItemID);
          });

          if (currentWatchListItemsResult === 0) {
               // this shouldn't ever happen!
               return;
          }

          const currentWatchListItems = currentWatchListItemsResult[0];

          currentWatchListItems["ImageLoaded"] = true;

          setWatchListItems(newWatchListItems);
     };

     const showDefaultSrc = (watchListItemID: number) => (): void => {
          const newWatchListItems = Object.assign([], watchListItems);

          const currentWatchListItemsResult = newWatchListItems?.filter((currentWatchListItems: typeof IWatchListItem) => {
               return String(currentWatchListItems.WatchListItemID) === String(watchListItemID);
          });

          if (currentWatchListItemsResult === 0) {
               // this shouldn't ever happen!
               return;
          }

          const currentWatchListItems = currentWatchListItemsResult[0];

          currentWatchListItems["IMDB_Poster_Error"] = true;

          setWatchListItems(newWatchListItems);
     };

     useEffect(() => {
          if (!watchListItemsSortingComplete && watchListItemsLoadingComplete) {
               const newWatchListItems = Object.assign([], watchListItems);

               newWatchListItems.sort((a: typeof IWatchListSortColumn, b: typeof IWatchListSortColumn) => {
                    switch (watchListSortColumn) {
                         case "ID":
                              return parseInt(a.WatchListItemID) > parseInt(b.WatchListItemID) ? (watchListSortDirection === "ASC" ? 1 : -1) : watchListSortDirection === "ASC" ? -1 : 1;
                         case "Name":
                              return String(a.WatchListItemName) > String(b.WatchListItemName) ? (watchListSortDirection === "ASC" ? 1 : -1) : watchListSortDirection === "ASC" ? -1 : 1;
                    }
               });

               setWatchListItems(newWatchListItems);
               setWatchListItemsSortingComplete(true);
          }
     }, [setWatchListItems, setWatchListItemsSortingComplete, watchListItems, watchListItemsLoadingComplete, watchListSortColumn, watchListItemsSortingComplete, watchListSortDirection]);

     useEffect(() => {
          if (watchListCount === 0) {
               setWatchListLoadingStarted(false);
               setWatchListLoadingComplete(false);
          }

          if (watchListItems.length === 0) {
               setWatchListItemsLoadingStarted(false);
               setWatchListItemsLoadingComplete(false);
               setWatchListItemsSortingComplete(false);
          }
     }, [setWatchListLoadingStarted, setWatchListItemsLoadingStarted, setWatchListLoadingComplete, setWatchListItemsLoadingComplete, setWatchListItemsSortingComplete, watchListCount, watchListItems.length]);

     return (
          <>
      <div className="flex sticky w-screen bg-background/80 backdrop-blur-md gap-4 justify-between items-center px-4 py-6">
        {/* The screen title */}
        <div className="text-3xl md:text-4xl font-bold text-foreground w-full">
                  My List
                </div>
                
                    
                         
                         <Button className="" onClick={() => openDetailClickHandler(-1)}>Add New <Plus className="ml-1 w-4 h-4"/></Button>
                 
              
              </div>

               <ul className="clickable show-list">
                    {watchListItems?.filter(
                         (currentWatchListItem: typeof IWatchListItem) =>
                              currentWatchListItem.Archived === archivedVisible &&
                              (searchTerm === "" || (searchTerm !== "" && (String(currentWatchListItem.WatchListItemName).toLowerCase().includes(searchTerm) || String(currentWatchListItem.IMDB_URL) == searchTerm || String(currentWatchListItem.IMDB_Poster) == searchTerm))) &&
                              (typeFilter === "-1" || (typeFilter !== "-1" && String(currentWatchListItem.WatchListTypeID) === String(typeFilter))) &&
                              (showMissingArtwork === false || (showMissingArtwork === true && currentWatchListItem.IMDB_Poster_Error === true)),
                    )
                         .map((currentWatchListItem: typeof IWatchListItem, index: number) => {
                              return (
                                   <React.Fragment key={index}>
                                        {watchListItemsSortingComplete && (
                                             <li className="show-item">
                                                  <span className="item-id" onClick={() => openDetailClickHandler(currentWatchListItem?.WatchListItemID)}>
                                                       <div>{currentWatchListItem?.WatchListItemID}</div>
                                                  </span>

                                                  <a className="show-link" onClick={() => openDetailClickHandler(currentWatchListItem?.WatchListItemID)}>
                                                       <div className="image-crop">
                                                            {currentWatchListItem?.IMDB_Poster !== null && currentWatchListItem?.IMDB_Poster_Error !== true && <img alt={currentWatchListItem?.WatchListItemName} src={currentWatchListItem?.IMDB_Poster} onLoad={() => setImageLoaded(currentWatchListItem?.WatchListItemID)} onError={() => showDefaultSrc(currentWatchListItem?.WatchListItemID)} />}

                                                            {(currentWatchListItem?.IMDB_Poster === null || currentWatchListItem?.IMDB_Poster_Error === true) && <>{BrokenImageIcon}</>}
                                                       </div>
                                                  </a>

                                                  <div>
                                                       {typeof currentWatchListItem?.IMDB_URL !== "undefined" &&
                                                            <a href={currentWatchListItem?.IMDB_URL} target='_blank'>{currentWatchListItem?.WatchListItemName}</a>
                                                       }

                                                       {typeof currentWatchListItem?.IMDB_URL === "undefined" &&
                                                            <div>
                                                                 {currentWatchListItem?.WatchListItemName}
                                                            </div>
                                                       }

                                                       {currentWatchListItem?.Archived === true ? <span>&nbsp;(A)</span> : <></>}
                                                  </div>

                                                  <span>
                                                       <div>{currentWatchListItem?.WatchListType?.WatchListTypeName}</div>
                                                  </span>
                                             </li>
                                        )}
                                   </React.Fragment>
                              );
                         })}
               </ul>

               {watchListItemDtlID !== null && (
                    <WatchListItemDetail
                         BrokenImageIcon={BrokenImageIcon}
                         CancelIcon={CancelIcon}
                         demoMode={demoMode}
                         EditIcon={EditIcon}
                         isAdding={isAdding}
                         isEditing={isEditing}
                         SaveIcon={SaveIcon}
                         setIsAdding={setIsAdding}
                         setIsEditing={setIsEditing}
                         setNewWatchListItemDtlID={setNewWatchListItemDtlID}
                         setWatchListItemDtlID={setWatchListItemDtlID}
                         setWatchListItemsLoadingComplete={setWatchListItemsLoadingComplete}
                         setWatchListItemsLoadingStarted={setWatchListItemsLoadingStarted}
                         watchListItemDtlID={watchListItemDtlID}
                         watchListTypes={watchListTypes}
                    />
               )}
          </>
     );
};

WatchListItems.propTypes = exact({
     AddIcon: PropTypes.object.isRequired,
     archivedVisible: PropTypes.bool.isRequired,
     BrokenImageIcon: PropTypes.object.isRequired,
     CancelIcon: PropTypes.object.isRequired,
     demoMode: PropTypes.bool.isRequired,
     isAdding: PropTypes.bool.isRequired,
     EditIcon: PropTypes.object.isRequired,
     isEditing: PropTypes.bool.isRequired,
     SaveIcon: PropTypes.object.isRequired,
     searchTerm: PropTypes.string.isRequired,
     setIsAdding: PropTypes.func.isRequired,
     setIsEditing: PropTypes.func.isRequired,
     setNewWatchListItemDtlID: PropTypes.func.isRequired,
     setWatchListItems: PropTypes.func.isRequired,
     setWatchListLoadingComplete: PropTypes.func.isRequired,
     setWatchListLoadingStarted: PropTypes.func.isRequired,
     setWatchListItemsLoadingStarted: PropTypes.func.isRequired,
     setWatchListItemsLoadingComplete: PropTypes.func.isRequired,
     setWatchListItemsSortingComplete: PropTypes.func.isRequired,
     showMissingArtwork: PropTypes.bool.isRequired,
     typeFilter: PropTypes.string.isRequired,
     watchListCount: PropTypes.number.isRequired,
     watchListItems: PropTypes.array.isRequired,
     watchListItemsLoadingComplete: PropTypes.bool.isRequired,
     watchListItemsSortingComplete: PropTypes.bool.isRequired,
     watchListSortColumn: PropTypes.string.isRequired,
     watchListSortDirection: PropTypes.string.isRequired,
     watchListTypes: PropTypes.array.isRequired,
});

export default WatchListItems;