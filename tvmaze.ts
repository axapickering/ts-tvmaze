import jQuery, { get } from 'jquery';

const $ = jQuery;

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $searchForm = $("#searchForm");
const BASE_URL = "http://api.tvmaze.com";
const MISSING_IMAGE_URL = "https://tinyurl.com/tv-missing";

interface showInterface {
  id: number;
  name: string;
  summary: string;
  image?: string;
}

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

async function searchShowsByTerm(term:string) :Promise <showInterface[]> {
  // ADD: Remove placeholder & make request to TVMaze search shows API.
  const params: URLSearchParams = new URLSearchParams({ q: term });
  const response : Response = await fetch(`${BASE_URL}/search/shows?${params}`);

  let data: {show: {id: number, name: string, summary: string, image: {original: string}}}[] = await response.json();

  const shows:showInterface[] = data.map( show => {
    let showI: showInterface = {
      id: show.show.id,
      name: show.show.name,
      summary: show.show.summary,
      image: show.show.image?.original || MISSING_IMAGE_URL
    };
    return showI;
  }
  );

  return shows;
}


/** Given list of shows, create markup for each and add to DOM */
function populateShows(shows:showInterface[]) {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src="${show.image}"
              alt="${show.name}"
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `);

    $showsList.append($show);
  }
}


/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */
async function searchForShowAndDisplay() {

  const term :string = String($("#searchForm-term").val());
  const shows = await searchShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});


interface episodeInterface {
  id: number;
  name: string;
  season: string;
  number: string;
}
/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

async function getEpisodesOfShow(id: number) :Promise <episodeInterface[]>  {
  const response : Response = await fetch(`${BASE_URL}/shows/${id}/episodes`);
  const data :episodeInterface[]= await response.json();
  const episodes :episodeInterface[] = data.map(episode =>(
    {
    id: episode.id,
    name: episode.name,
    season: episode.season,
    number: episode.number
  }))

  return episodes;
}

/** Given list of episodes, create markup for each and add to DOM */
function populateEpisodes(episodes:episodeInterface[]) {
  const $episodesList :JQuery<HTMLElement> = $('#episodesList')
  $episodesList.empty();
  const episodesAsLi :string[]= episodes.map(episode => `<li>${episode.name} (season ${episode.season}, number ${episode.number})</li>`)
  episodesAsLi.forEach(li => {$episodesList.append(li)});

 $episodesArea.show();
}


/** Handle showEpisodes button click: get episodes
 *    info from API, add to episodes, and show episodes area.
 */
async function showEpisodes (evt: JQuery.ClickEvent<HTMLElement>) {
  const id :number = Number($(evt.target).closest('[data-show-id]').data("showId"));
  const episodes :episodeInterface[] = await getEpisodesOfShow(id)
  populateEpisodes(episodes);
}

$showsList.on("click", ".Show-getEpisodes", async function (evt: JQuery.ClickEvent<HTMLElement>) {
  evt.preventDefault();
  await showEpisodes(evt);
});