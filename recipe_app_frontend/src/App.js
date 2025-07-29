import React, { useState, useEffect, createContext, useContext } from "react";
import "./App.css";

// Simulate backend data and auth (replace with actual API/integration)
const DUMMY_RECIPES = [
  {
    id: "1",
    name: "Classic Margherita Pizza",
    category: "Pizza",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    ingredients: ["flour", "tomatoes", "mozzarella", "basil", "olive oil"],
    instructions:
      "1. Preheat oven to 475°F (245°C). 2. Spread pizza dough. 3. Apply tomato sauce, mozzarella, and basil. 4. Bake 10-12 min. 5. Drizzle with olive oil, serve.",
    description: "A simple yet delicious pizza with fresh mozzarella and basil."
  },
  {
    id: "2",
    name: "Vegan Buddha Bowl",
    category: "Bowl",
    image: "https://images.unsplash.com/photo-1512058564366-c9e3e0466c54?w=600&q=80",
    ingredients: ["quinoa", "chickpeas", "avocado", "spinach", "carrots", "sesame seeds"],
    instructions:
      "1. Cook quinoa. 2. Roast chickpeas. 3. Assemble bowl: quinoa, veggies, avocado, chickpeas. 4. Top with sesame seeds.",
    description: "A wholesome, plant-based bowl for a nutritious meal."
  },
  {
    id: "3",
    name: "Spaghetti Carbonara",
    category: "Pasta",
    image: "https://images.unsplash.com/photo-1523987355523-c7b5b0723c6e?w=600&q=80",
    ingredients: ["spaghetti", "eggs", "bacon", "parmesan", "black pepper"],
    instructions:
      "1. Boil spaghetti. 2. Cook bacon. 3. Mix eggs and cheese. 4. Combine all with hot pasta, toss quickly.",
    description: "An Italian classic with creamy sauce and crispy bacon."
  }
];

// Simulated user authentication and favorites (replace with Supabase/Auth provider in production)
const AuthContext = createContext();
function useAuth() {
  return useContext(AuthContext);
}
const getInitialUser = () => {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
};

const getInitialFavorites = () => {
  const raw = localStorage.getItem("favorites");
  return raw ? JSON.parse(raw) : [];
};

// Components

function App() {
  // Theme handling (from provided template)
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  // Authentication (simulate user state)
  const [user, setUser] = useState(getInitialUser());
  const login = (uname, password) => {
    // Replace this authentication logic with actual call to API/Supabase later
    if (uname && password) {
      const u = { username: uname };
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
      return true;
    }
    return false;
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Layout states
  const [category, setCategory] = useState("All");
  const [searchValue, setSearchValue] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  // Navigation state
  const [currentPage, setCurrentPage] = useState("browse"); // browse | favorites | details
  const [detailsId, setDetailsId] = useState(null);

  // Favorites
  const [favorites, setFavorites] = useState(getInitialFavorites());
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Derived state
  const allCategories = ["All", ...Array.from(new Set(DUMMY_RECIPES.map((r) => r.category)))];

  function getFilteredRecipes() {
    let recipes = DUMMY_RECIPES;
    if (category !== "All") {
      recipes = recipes.filter((r) => r.category === category);
    }
    if (searchValue.trim()) {
      const q = searchValue.trim().toLowerCase();
      recipes = recipes.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.ingredients.some((ing) => ing.toLowerCase().includes(q))
      );
    }
    return recipes;
  }
  function handleFav(recipeId) {
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (!favorites.includes(recipeId)) {
      setFavorites([...favorites, recipeId]);
    }
  }
  function removeFav(recipeId) {
    setFavorites(favorites.filter((id) => id !== recipeId));
  }
  function goToRecipe(recipeId) {
    setDetailsId(recipeId);
    setCurrentPage("details");
  }

  // Render
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="App" style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
        <Header
          user={user}
          onLogin={() => setShowLogin(true)}
          onLogout={logout}
          onShowFavorites={() => setCurrentPage("favorites")}
          onShowBrowse={() => setCurrentPage("browse")}
          currentPage={currentPage}
        />
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <div className="main-layout">
          <Sidebar
            categories={allCategories}
            category={category}
            setCategory={(c) => {
              setCategory(c);
              setCurrentPage("browse");
            }}
          />
          <main style={{ flex: 1, padding: "2rem" }}>
            {currentPage === "browse" && (
              <>
                <SearchBar value={searchValue} setValue={setSearchValue} />
                <RecipeList
                  recipes={getFilteredRecipes()}
                  onSelect={goToRecipe}
                  favorites={favorites}
                  onFav={handleFav}
                  removeFav={removeFav}
                  user={user}
                />
              </>
            )}
            {currentPage === "favorites" && (
              <FavoritesPage
                recipes={DUMMY_RECIPES.filter((r) => favorites.includes(r.id))}
                onSelect={goToRecipe}
                removeFav={removeFav}
              />
            )}
            {currentPage === "details" && detailsId && (
              <RecipeDetails
                recipe={DUMMY_RECIPES.find((r) => r.id === detailsId)}
                isFavorite={favorites.includes(detailsId)}
                onFav={handleFav}
                removeFav={removeFav}
                onBack={() => setCurrentPage("browse")}
                user={user}
              />
            )}
          </main>
        </div>
        {showLogin && (
          <LoginModal
            onClose={() => setShowLogin(false)}
            onLogin={(u, p) => {
              if (login(u, p)) setShowLogin(false);
            }}
            onShowRegister={() => {
              setShowLogin(false);
              setShowRegister(true);
            }}
          />
        )}
        {showRegister && (
          <RegisterModal
            onClose={() => setShowRegister(false)}
            onRegister={(u, p) => {
              // Simulate registration success and login
              login(u, p);
              setShowRegister(false);
            }}
            onShowLogin={() => {
              setShowRegister(false);
              setShowLogin(true);
            }}
          />
        )}
      </div>
    </AuthContext.Provider>
  );
}

// --- UI Components ---

function Header({ user, onLogin, onLogout, onShowFavorites, onShowBrowse, currentPage }) {
  return (
    <header
      className="navbar"
      style={{
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        padding: "1.5rem 2rem",
        borderBottom: "1px solid var(--border-color)",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 99
      }}
    >
      <div className="brand" style={{ fontWeight: 700, fontSize: "1.7rem", letterSpacing: 1 }}>
        <span style={{ color: "var(--text-primary)" }}>Recipe</span>
        <span style={{ color: "#ff9800" }}>Book</span>
      </div>
      <nav style={{ display: "flex", gap: "2rem" }}>
        <button
          className="nav-btn"
          style={{
            background: "none",
            border: "none",
            fontSize: "1.1rem",
            color: currentPage === "browse" ? "#4caf50" : "var(--text-primary)",
            padding: 0,
            cursor: "pointer"
          }}
          onClick={onShowBrowse}
        >
          Browse
        </button>
        <button
          className="nav-btn"
          style={{
            background: "none",
            border: "none",
            fontSize: "1.1rem",
            color: currentPage === "favorites" ? "#4caf50" : "var(--text-primary)",
            padding: 0,
            cursor: "pointer"
          }}
          onClick={onShowFavorites}
        >
          Favorites
        </button>
      </nav>
      <div>
        {!user ? (
          <button
            className="btn"
            style={{
              background: "var(--button-bg)",
              color: "var(--button-text)",
              padding: "0.5rem 1.2rem",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              letterSpacing: 0.5,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)"
            }}
            onClick={onLogin}
          >
            Log in
          </button>
        ) : (
          <span style={{ color: "#4caf50", marginRight: "1rem" }}>
            {user.username}
            <button
              className="btn"
              style={{
                background: "transparent",
                color: "var(--text-secondary)",
                marginLeft: 12,
                border: "none",
                fontSize: 14,
                cursor: "pointer"
              }}
              onClick={onLogout}
            >
              Log out
            </button>
          </span>
        )}
      </div>
    </header>
  );
}

function Sidebar({ categories, category, setCategory }) {
  return (
    <aside
      style={{
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-color)",
        minWidth: 170,
        padding: "2rem 1.5rem 2rem 2rem",
        display: "flex",
        flexDirection: "column",
        gap: 18
      }}
    >
      <div style={{ fontWeight: 600, textTransform: "uppercase", fontSize: 14, marginBottom: 10 }}>
        Categories
      </div>
      {categories.map((cat) => (
        <button
          key={cat}
          style={{
            background: category === cat ? "#4caf50" : "transparent",
            color: category === cat ? "#fff" : "var(--text-primary)",
            border: "none",
            borderRadius: 8,
            padding: "0.5rem 0.9rem",
            marginBottom: 3,
            cursor: "pointer",
            fontWeight: category === cat ? 700 : 400,
            transition: "all .25s"
          }}
          onClick={() => setCategory(cat)}
        >
          {cat}
        </button>
      ))}
    </aside>
  );
}

function SearchBar({ value, setValue }) {
  return (
    <div style={{ marginBottom: 26, display: "flex", gap: 12 }}>
      <input
        aria-label="Search recipes"
        type="search"
        value={value}
        placeholder="Search recipes or ingredients..."
        onChange={(e) => setValue(e.target.value)}
        style={{
          flex: 1,
          border: "1px solid var(--border-color)",
          borderRadius: 8,
          padding: "0.7rem 1rem",
          fontSize: 16
        }}
      />
    </div>
  );
}

function RecipeList({ recipes, onSelect, favorites, onFav, removeFav, user }) {
  if (!recipes.length)
    return (
      <div style={{ marginTop: 40, color: "var(--text-secondary)" }}>
        No recipes found.
      </div>
    );

  return (
    <div
      className="recipe-list"
      style={{
        display: "grid",
        gap: 32,
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))"
      }}
    >
      {recipes.map((r) => (
        <div
          key={r.id}
          className="recipe-card"
          style={{
            background: "var(--bg-secondary)",
            borderRadius: 16,
            boxShadow: "0 1px 4px rgba(44,62,80,0.09)",
            border: "1px solid var(--border-color)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            minHeight: 320
          }}
        >
          <img
            src={r.image}
            alt={r.name}
            loading="lazy"
            style={{
              width: "100%",
              height: 140,
              objectFit: "cover"
            }}
            onClick={() => onSelect(r.id)}
          />
          <div style={{ padding: "1rem", flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: "0 0 8px",
                cursor: "pointer"
              }}
              onClick={() => onSelect(r.id)}
            >
              {r.name}
            </h2>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>
              {r.description}
            </div>
            <div style={{ flexGrow: 1 }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontSize: 12,
                  color: "#ff9800",
                  fontWeight: 500,
                  background: "#ffecb3",
                  padding: "2px 8px",
                  borderRadius: 7,
                  letterSpacing: 0.2
                }}
              >
                {r.category}
              </span>
              <button
                className="btn-fav"
                aria-label={
                  favorites.includes(r.id)
                    ? "Remove from favorites"
                    : user
                    ? "Add to favorites"
                    : "Log in to favorite"
                }
                title={
                  favorites.includes(r.id)
                    ? "Remove from favorites"
                    : user
                    ? "Add to favorites"
                    : "Log in to favorite"
                }
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 22,
                  color: favorites.includes(r.id)
                    ? "#ff9800"
                    : "var(--text-secondary)"
                }}
                onClick={() =>
                  favorites.includes(r.id)
                    ? removeFav(r.id)
                    : onFav(r.id)
                }
              >
                {favorites.includes(r.id) ? "★" : "☆"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecipeDetails({ recipe, isFavorite, onFav, removeFav, onBack, user }) {
  if (!recipe)
    return (
      <div>
        <button style={{ marginBottom: 14 }} onClick={onBack}>
          ← Back
        </button>
        <div>Recipe not found.</div>
      </div>
    );
  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <button className="btn" style={{ marginBottom: 24 }} onClick={onBack}>
        ← Back to list
      </button>
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: 16,
          padding: "2rem"
        }}
      >
        <img
          src={recipe.image}
          alt={recipe.name}
          style={{
            width: "100%",
            height: 260,
            objectFit: "cover",
            borderRadius: 13,
            marginBottom: 18
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontWeight: 800, fontSize: 32 }}>{recipe.name}</h1>
          <button
            className="btn-fav"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 30,
              color: isFavorite ? "#ff9800" : "var(--text-secondary)"
            }}
            onClick={() => (isFavorite ? removeFav(recipe.id) : onFav(recipe.id))}
          >
            {isFavorite ? "★" : "☆"}
          </button>
        </div>
        <div style={{ marginBottom: 12, color: "#4caf50", fontWeight: 500 }}>
          {recipe.category}
        </div>
        <div>
          <strong>Ingredients:</strong>
          <ul style={{ textAlign: "left", marginLeft: 20, marginTop: 8 }}>
            {recipe.ingredients.map((i) => (
              <li key={i} style={{ fontSize: 16, color: "var(--text-primary)" }}>
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: 14 }}>
          <strong>Instructions:</strong>
          <p style={{ textAlign: "left", marginLeft: 8, marginTop: 8 }}>{recipe.instructions}</p>
        </div>
      </div>
    </div>
  );
}

function FavoritesPage({ recipes, onSelect, removeFav }) {
  return (
    <div>
      <h2
        style={{
          fontWeight: 700,
          fontSize: 26,
          color: "#4caf50",
          marginBottom: 28
        }}
      >
        Your Favorites
      </h2>
      {!recipes.length ? (
        <p style={{ color: "var(--text-secondary)" }}>
          You have no favorite recipes yet.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 32,
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))"
          }}
        >
          {recipes.map((r) => (
            <div
              key={r.id}
              style={{
                background: "var(--bg-secondary)",
                borderRadius: 16,
                boxShadow: "0 1px 4px rgba(44,62,80,0.09)",
                border: "1px solid var(--border-color)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                minHeight: 320
              }}
            >
              <img
                src={r.image}
                alt={r.name}
                loading="lazy"
                style={{
                  width: "100%",
                  height: 140,
                  objectFit: "cover"
                }}
                onClick={() => onSelect(r.id)}
              />
              <div style={{ padding: "1rem", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <h2
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    margin: "0 0 8px",
                    cursor: "pointer"
                  }}
                  onClick={() => onSelect(r.id)}
                >
                  {r.name}
                </h2>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>
                  {r.description}
                </div>
                <div style={{ flexGrow: 1 }} />
                <button
                  className="btn"
                  aria-label="Remove from favorites"
                  style={{
                    background: "#ff9800",
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 15,
                    padding: "0.42rem 1rem",
                    border: "none",
                    cursor: "pointer"
                  }}
                  onClick={() => removeFav(r.id)}
                >
                  Remove ★
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Auth Modals ---

function LoginModal({ onClose, onLogin, onShowRegister }) {
  const [uname, setU] = useState("");
  const [pw, setP] = useState("");
  const [msg, setMsg] = useState("");
  function handleLogin() {
    if (!uname || !pw) return setMsg("Enter username and password.");
    // Accept any user for simulation, otherwise integrate with API
    onLogin(uname, pw) || setMsg("Login failed.");
  }
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Login</h2>
        {msg && <div className="form-error">{msg}</div>}
        <input
          autoFocus
          type="text"
          placeholder="Username"
          value={uname}
          onChange={(e) => setU(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setP(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
        />
        <button className="btn" style={{ marginTop: 15 }} onClick={handleLogin}>
          Log In
        </button>
        <p style={{ marginTop: 14 }}>
          <span style={{ color: "var(--text-secondary)" }}>No account?</span>{" "}
          <button style={{ background: "none", border: "none", color: "#4caf50", cursor: "pointer" }} onClick={onShowRegister}>Register</button>
        </p>
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
      </div>
    </div>
  );
}

function RegisterModal({ onClose, onRegister, onShowLogin }) {
  const [uname, setU] = useState("");
  const [pw, setP] = useState("");
  const [msg, setMsg] = useState("");
  function handleRegister() {
    if (!uname || !pw) return setMsg("Choose a username and password.");
    // Here would call API for registration
    onRegister(uname, pw);
  }
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>Register</h2>
        {msg && <div className="form-error">{msg}</div>}
        <input
          autoFocus
          type="text"
          placeholder="Username"
          value={uname}
          onChange={(e) => setU(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setP(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleRegister(); }}
        />
        <button className="btn" style={{ marginTop: 15 }} onClick={handleRegister}>
          Register
        </button>
        <p style={{ marginTop: 14 }}>
          <span style={{ color: "var(--text-secondary)" }}>Already have an account?</span>{" "}
          <button style={{ background: "none", border: "none", color: "#4caf50", cursor: "pointer" }} onClick={onShowLogin}>Log in</button>
        </p>
        <button className="modal-close" onClick={onClose} aria-label="Close">&times;</button>
      </div>
    </div>
  );
}

// --- Layout helper styles (extend App.css in real implementation) ---

// Layout wrapper for sidebar + main
// Add this CSS (or combine with App.css in real prod app)
const layoutStyle = document.createElement("style");
layoutStyle.innerHTML = `
.main-layout {
  display: flex;
  min-height: calc(100vh - 80px);
}
@media (max-width: 850px) {
  .main-layout {
    flex-direction: column;
  }
  aside {
    min-width: 100%!important;
    padding: 1rem!important;
    border-right: none!important;
    border-bottom: 1px solid var(--border-color);
  }
}
.modal-overlay {
  background: rgba(28,32,41,0.45);
  position: fixed;
  z-index: 1010;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-box {
  background: var(--bg-primary);
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(44,62,80,0.13);
  padding: 2.3rem 2.2rem;
  min-width: 290px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 13px;
}
.modal-box input {
  border: 1px solid var(--border-color);
  border-radius: 7px;
  padding: 0.7rem 1rem;
  font-size: 16px;
  margin-bottom: 8px;
}
.modal-close {
  position: absolute;
  top: 10px; right: 13px;
  background: none; border: none;
  color: var(--text-secondary);
  font-size: 2rem;
  cursor: pointer;
  font-weight: 700;
}
.btn {
  background: var(--button-bg);
  color: var(--button-text);
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn:hover {
  background: #388e3c;
}
.form-error {
  color: #b71c1c;
  font-size: 14px;
  margin-bottom: 9px;
}
::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 11px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
`;
document.head.appendChild(layoutStyle);

export default App;
