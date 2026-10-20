
const searchInput = document.getElementById("recipeSearch");
const categoryFilter = document.getElementById("recipeFilter");
const sortSelect = document.getElementById("recipeSort");
const searchButton = document.getElementById("searchButton");

searchButton.addEventListener("click", function () {

    const searchText = searchInput.value.trim();
    const category = categoryFilter.value;
    const sort = sortSelect.value;

    const params = new URLSearchParams();

    if (searchText) {
        params.set("search", searchText);
    }

    if (category !== "all") {
        params.set("category", category);
    }

    params.set("sort", sort);

    window.location.href = `books.html?${params.toString()}`;

});
