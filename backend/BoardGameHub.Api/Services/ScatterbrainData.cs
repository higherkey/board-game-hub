namespace BoardGameHub.Api.Services;

public static class ScatterbrainData
{
    public enum LetterMode
    {
        Normal,     // Excludes difficult letters (Q, V, X, Z, etc.)
        Hard,       // Only difficult letters
        TrueRandom  // All letters
    }

    private static readonly char[] NormalLetters = "ABCDEFGHIJKLMNPRSTW".ToCharArray(); // Official Scattergories Die (roughly)
    private static readonly char[] HardLetters = "QUVXYZ".ToCharArray();
    private static readonly char[] AllLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".ToCharArray();

    public static char GetLetter(LetterMode mode)
    {
        var rng = new Random();
        return mode switch
        {
            LetterMode.Normal => NormalLetters[rng.Next(NormalLetters.Length)],
            LetterMode.Hard => HardLetters[rng.Next(HardLetters.Length)],
            _ => AllLetters[rng.Next(AllLetters.Length)]
        };
    }

    public static List<string> GetList(int listId)
    {
        if (GlobalLists.TryGetValue(listId, out var list))
        {
            return list;
        }
        // Fallback to List 1 if not found
        return GlobalLists[1];
    }
    
    public class ListMetadata
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public List<string> PreviewCategories { get; set; } = new();
    }

    public static List<ListMetadata> GetListsMetadata()
    {
        return GlobalLists.Select(kvp => new ListMetadata
        {
            Id = kvp.Key,
            Name = $"List {kvp.Key}", // We could add better names later
            PreviewCategories = kvp.Value.Take(5).ToList()
        }).ToList();
    }

    public static List<string> GetRandomList()
    {
        var rng = new Random();
        var keys = GlobalLists.Keys.ToList();
        var randomKey = keys[rng.Next(keys.Count)];
        return GlobalLists[randomKey];
    }

    public static List<string> GenerateList(string seed)
    {
        // For now, this is a mock "AI" generator. 
        // It picks categories that might feel related to the seed keyword.
        var rng = new Random();
        var allCats = GlobalLists.Values.SelectMany(x => x).Distinct().ToList();
        
        // Very simple "keyword" mock:
        // If the seed is long, just use random but focused.
        // If we were real pros, we'd use an LLM here.
        
        // Let's create some "Generative" pools based on manual categories
        var pools = new Dictionary<string, List<string>>
        {
            { "nature", new List<string> { "Trees", "Birds", "Flowers", "Insects", "Reptiles/Amphibians", "Things in a garden", "Things in a park", "Things that are green", "Things found in the ocean" } },
            { "home", new List<string> { "Furniture", "Appliances", "Electronic gadgets", "Items in a refrigerator", "Things in a bathroom", "Items in a purse/wallet", "Things you plug in", "Things with wheels" } },
            { "school", new List<string> { "School subjects", "School supplies", "College majors", "Colleges/Universities", "Authors", "Historical figures", "Boy bands", "Colors" } },
            { "food", new List<string> { "Breakfast foods", "Vegetables", "Fruits", "Desserts", "Types of drink", "Pizza toppings", "Kinds of candy", "Types of cheese", "Types of bread" } }
        };

        var seedLower = seed.ToLowerInvariant();
        var selectedPool = pools.FirstOrDefault(p => seedLower.Contains(p.Key)).Value;

        if (selectedPool != null && selectedPool.Count >= 12)
        {
            return selectedPool.OrderBy(x => rng.Next()).Take(12).ToList();
        }

        // Fallback: Mix of random categories
        return allCats.OrderBy(x => rng.Next()).Take(15).ToList();
    }

    public static readonly Dictionary<int, List<string>> GlobalLists = new()
    {
        { 1, new List<string> { "A boy's name", "U.S. Cities", "Things that are cold", "School subjects", "Pro sports teams", "Insects", "Breakfast foods", "Furniture", "TV Shows", "Things that are found in the ocean", "Presidents", "Product names", "Appliances", "Types of drink", "Personality traits" } },
        { 2, new List<string> { "Vegetables", "States", "Things you throw away", "Occupations", "Appliances", "Cartoon characters", "Types of drink", "Musical groups", "Store names", "Things at a football game", "Trees", "Personality traits", "Video games", "Electronic gadgets", "Board games" } },
        { 3, new List<string> { "Articles of clothing", "Desserts", "Car parts", "Things found on a map", "Athletes", "4-letter words", "Items in a refrigerator", "Farm animals", "Street names", "Things on a beach", "Colors", "Tools", "A girl's name", "Villains", "Footwear" } },
        { 4, new List<string> { "Fruits", "Things found in a desk", "Vacation spots", "Kinds of candy", "Nicknames", "Things you wear", "Heavy things", "Fast food", "Toys", "Weapons", "Things in a bathroom", "Gemstones", "Things with tails", "Hobbies", "Things you shout" } },
        { 5, new List<string> { "Sandwiches", "Items in a catalog", "World leaders", "School supplies", "Excuses for being late", "Ice cream flavors", "Things with a remote", "Card games", "Internet lingo", "Items in a vending machine", "Movie titles", "Something you're afraid of", "Things that smell good", "Things that are sticky", "Awards" } },
        { 6, new List<string> { "Double letter words", "Things found in a hospital", "Things playing at the movies", "Menu items", "Magazine titles", "Capitals", "Authors", "Bodies of water", "Birds", "Holidays", "Household chores", "Money", "Items in a purse/wallet", "Pizza toppings", "Colleges/Universities" } },
        { 7, new List<string> { "Fictional characters", "Things in a garden", "Things you buy for kids", "Things that have spots", "Things that are round", "Things in a park", "Things you do every day", "Reptiles/Amphibians", "Leisure activities", "Things you shouldn't touch", "Software", "Historical figures", "Spices/Herbs", "Things at a circus", "Things that jump" } },
        { 8, new List<string> { "Musical instruments", "Flowers", "Bad habits", "Disney characters", "Cosmetics/Toiletries", "Celebrities", "Cooking utensils", "Things that are green", "Things in a grocery store", "Reasons to quit your job", "Things lying on the ground", "Things in a souvenir shop", "Items in a suitcase", "Things with wheels", "Types of weather" } },
        { 9, new List<string> { "Food found in a can", "Things you plug in", "Boy bands", "Languages", "Things you hide", "Things made of wood", "Things with stripes", "Tourism destinations", "Things you fold", "Monument/Memorials", "Things in the sky", "Pizza places", "College majors", "Things with buttons", "Gifts" } },
        { 10, new List<string> { "Apps", "Things that contain water", "Things in a museum", "Things you climb", "Things you do on a date", "Things you build", "Things displayed in a shop window", "Things you do in secret", "Things in a medicine cabinet", "Things in a gym", "Things that are hot", "Things that are red", "Things that are yellow", "Things that are blue", "Things that are sharp" } },
        { 11, new List<string> { "Baby foods", "Famous duos", "Things found in a desk drawer", "Hobby supplies", "Things found in the basement", "Things found in the attic", "Things found in a garage", "Things found in a car", "Types of cheese", "Types of bread", "Types of meat", "Things you grill", "Things you make", "Things you break", "Superheroes" } },
        { 12, new List<string> { "Sports equipment", "Things you pull", "Things you push", "Things you lift", "Things you count", "Things you read", "Things you watch", "Things you listen to", "Things you drive", "Things you fly", "Things you sail", "Things you ride", "Things you catch", "Things you throw", "Things you kick" } },
        { 13, new List<string> { "Words ending in 'N'", "Words ending in 'Y'", "Words ending in 'R'", "Words ending in 'L'", "Words ending in 'T'", "Words ending in 'S'", "Words starting with 'A'", "Words starting with 'B'", "Words starting with 'C'", "Words starting with 'D'", "Words starting with 'E'", "Words starting with 'F'", "Words starting with 'G'", "Words starting with 'H'", "Words starting with 'I'" } },
        { 14, new List<string> { "Things in a toolbox", "Things in a sewing kit", "Things in a first aid kit", "Things in a lunchbox", "Things in a backpack", "Things in a pocket", "Things in a glove box", "Things in a trunk", "Things in a closet", "Things in a drawer", "Things in a pantry", "Things in a fridge", "Things in a freezer", "Things in a bathroom cabinet", "Things in a jewelry box" } },
        { 15, new List<string> { "Things you do in the morning", "Things you do at night", "Things you do on weekends", "Things you do in summer", "Things you do in winter", "Things you do in spring", "Things you do in fall", "Things you do on holiday", "Things you do for fun", "Things you do for work", "Things you do for exercise", "Things you do for money", "Things you do for free", "Things you do alone", "Things you do with friends" } }
    };
}
