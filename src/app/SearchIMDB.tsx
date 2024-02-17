const axios = require("axios");
const exact = require("prop-types-exact");
const GridEventListener = require("@mui/x-data-grid").GridEventListener;
const ISearchImdb = require("./interfaces/ISearchImdb");
const MuiIcon = require("@mui/icons-material").default;
const PropTypes = require("prop-types");
const React = require("react");
const useState = require("react").useState;

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";

const SearchIMDB = ({
  autoAdd,
  BrokenImageIcon,
  searchCount,
  setNewWatchListItemDtlID,
  setSearchVisible,
  setWatchListItemsLoadingStarted,
  setWatchListItemsLoadingComplete,
}: {
  autoAdd: boolean;
  BrokenImageIcon: typeof MuiIcon;
  searchCount: number;
  setSearchVisible: (arg0: boolean) => void;
  setNewWatchListItemDtlID: (arg0: number) => void;
  setWatchListItemsLoadingStarted: (arg0: boolean) => void;
  setWatchListItemsLoadingComplete: (arg0: boolean) => void;
}) => {
  const [searchResults, setSearchResults] = useState({});
  const [searchSubmitted, setSearchSubmitted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const addSearchResultClickHandler = (index: number) => {
    let itemType = 0;
    ``;

    if (searchResults[index].Type === "movie") {
      itemType = 1;
    } else if (searchResults[index].Type === "series") {
      itemType = 2;
    } else {
      itemType = 3;
    }

    const confirmAdd = confirm("Add IMDB search result ?");

    if (!confirmAdd) {
      return;
    }

    let paramStr = `/api/AddWatchListItem?WatchListItemName=${searchResults[index].Title}&WatchListTypeID=${itemType}`;

    paramStr += `&IMDB_URL=https://www.imdb.com/title/${searchResults[index].imdbID}/`;

    paramStr += `&IMDB_Poster=${searchResults[index].Poster}`;

    axios
      .put(paramStr)
      .then((res: typeof ISearchImdb) => {
        if (res.data[0] === "ERROR") {
          alert(
            `The error ${res.data[1]} occurred while adding the search result`
          );
        } else if (res.data[0] === "ERROR-ALREADY-EXISTS") {
          alert(res.data[1]);
        } else {
          setWatchListItemsLoadingStarted(false);
          setWatchListItemsLoadingComplete(false);

          if (autoAdd) {
            setNewWatchListItemDtlID(res.data[1]);
          }

          // Remove this item from the the search results since its been added
          const newSearchResults = Object.assign([], searchResults);
          newSearchResults.splice(index, 1);
          setSearchResults(newSearchResults);
        }
      })
      .catch((err: Error) => {
        alert(
          `The error ${err.message} occurred while adding the search result`
        );
      });
  };

  const closeSearch = async () => {
    setSearchVisible(false);
  };

  const onKeyUpHandler = (event: typeof GridEventListener) => {
    //if (event.key === "Enter") {
      setTimeout(() => {
        searchTermHandler();
      }, 1000); // Delay of 1000 milliseconds (1 second)
    //}
  };

  const searchTermHandler = () => {
    if (searchTerm === "") {
      //alert("Please enter a search term");
      return;
    }

    axios
      .get(
        `/api/SearchIMDB?SearchTerm=${searchTerm}&SearchCount=${searchCount}`
      )
      .then((res: typeof ISearchImdb) => {
        if (res.data[0] === "ERROR") {
          alert(`The error ${res.data[1]} occurred while  searching IMDB`);
        } else {
          setSearchResults(res.data[1]);
          setSearchSubmitted(true);
        }
      })
      .catch((err: Error) => {
        alert(`The error ${err.message} occurred while searching IMDB`);
      });
  };

    // State to control the opening of the dialog
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

    // Function to toggle the dialog's open state
    const toggleSearchDialog = () => setIsSearchDialogOpen(!isSearchDialogOpen);

  return (
    <>

      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Search />
          </Button>
        </DialogTrigger>
        <DialogContent className="transition-all w-full sm:max-w-[425px] md:min-w-[768px] max-h-[80vh] overflow-y-hidden">
          <DialogHeader>
            <DialogTitle>Search for a Movie or Show</DialogTitle>
          </DialogHeader>

          <div className="search-box mt-6 bg-background w-full">
            <div className={` ${searchSubmitted === true ? "" : ""}`}>
              <div className="flex w-full items-center space-x-2">
                <div className="flex-1">
                  <Input
                    type="search"
                    placeholder="e.g. Anchorman or The Office"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    onKeyUp={(event) => onKeyUpHandler(event)}
                  />
                </div>
                {/* <Button>Search</Button> */}
              </div>
            </div>
          </div>
          <div className="transition-all search-results max-h-[500px] overflow-y-scroll overflow-x-hidden mt-4">
            <div className="w-full divide-y divide-border overflow-x-hidden">
              <div className="transition-all divide-y divide-border bg-background flex flex-col justify-center overflow-x-hidden">
                {searchResults.length > 0 &&
                  searchResults.map(
                    (currentResult: typeof ISearchImdb, index: number) => {
                      return (
                        <div key={index} className="flex items-center">
                          {currentResult.Poster !== "N/A" && (
                            // The poster column
                            <div className="whitespace-nowrap py-5 pl-4 pr-1 text-sm sm:pl-0 min-w-16 flex justify-center">
                              <img
                                className="aspect-[4/6] w-28"
                                src={currentResult.Poster}
                                alt={currentResult.Title}
                              />
                            </div>
                          )}

                          {currentResult.Poster == "N/A" && (
                            <img
                              className="aspect-[4/6] w-24"
                              src={BrokenImageIcon}
                              alt={currentResult.Title}
                            />
                          )}

                          <div className="whitespace-nowrap px-3 py-5 text-sm flex-1">
                            <span className="text-base md:text-lg font-medium text-pretty">
                              {currentResult.Title} ({currentResult.Year})
                            </span>
                          </div>
                          <div className="relative whitespace-nowrap py-5 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                            <span
                              className="addSearchResultIcon"
                              onClick={(event) =>
                                addSearchResultClickHandler(index)
                              }
                            >
                              <Button size="icon" variant="outline">
                                <Plus />
                              </Button>
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

SearchIMDB.propTypes = exact({
  autoAdd: PropTypes.bool.isRequired,
  BrokenImageIcon: PropTypes.object.isRequired,
  searchCount: PropTypes.number.isRequired,
  setNewWatchListItemDtlID: PropTypes.func.isRequired,
  setSearchVisible: PropTypes.func.isRequired,
  setWatchListItemsLoadingStarted: PropTypes.func.isRequired,
  setWatchListItemsLoadingComplete: PropTypes.func.isRequired,
});

export default SearchIMDB;
