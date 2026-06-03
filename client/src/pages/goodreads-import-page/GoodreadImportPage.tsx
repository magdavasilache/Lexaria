import axios from "axios";
import { useState } from "react";
import { API_URL } from "../../utils/constants";
import { useAuthStore } from "../../api-handling/context/authentication/useAuthStore";

export default function GoodreadsImportPage() {
    const [favoriteGenres, setFavoriteGenres] = useState<File | null>(null);
    const [reviews, setReviews] = useState<File | null>(null);
    const accessToken = useAuthStore(state => state.accessToken)
  
    const handleSubmit = async (e: any) => {
      e.preventDefault();
    
      if (!favoriteGenres || !reviews) {
        alert("Please select both files before uploading.");
        return;
      }
    
      const formData = new FormData();
      formData.append("favorite_genres", favoriteGenres);
      formData.append("reviews", reviews);
    
      try {
        const res = await axios.post(
          `${API_URL}book/process_goodreads_data`,
          formData,
          {
            headers: {
              "Authorization": `Bearer ${accessToken}`,
            },
          }
        );
    
        if (res.status === 200) {
          alert("Files imported successfully!");
        }
      } catch (err) {
        console.error(err);
        alert("Import failed. Check console for details.");
      }
    };
    
    return (
<div className="w-full h-screen p-6 flex items-center justify-center bg-backgroundLight dark:bg-backgroundDark">
  <form
    onSubmit={handleSubmit}
    className="max-w-2xl w-full bg-paperLight dark:bg-paperDark rounded-xs shadow-cardShadowLight dark:shadow-cardShadowDark p-8 space-y-6 animate-slide-in"
  >
    <h1 className="text-3xl font-libre font-bold text-fontPrimaryLight dark:text-fontSecondaryDark">
      Import Your Goodreads Data
    </h1>

    <p className="text-fontPrimaryLight dark:text-fontSecondaryDark leading-relaxed">
      Extract the{" "}
      <span className="font-semibold text-primaryLight dark:text-primaryDark">
        favorite_genres
      </span>{" "}
      and{" "}
      <span className="font-semibold text-primaryLight dark:text-primaryDark">
        reviews
      </span>{" "}
      JSON files from your Goodreads account and upload them below. Then press{" "}
      <span className="italic text-secondaryLight dark:text-secondaryDark">
        "Add Goodreads Files"
      </span>{" "}
      to save your preferences and reading history to your Lexaria account.
    </p>

    {/* Favorite Genres */}
    <div>
      <label className="block mb-2 font-medium text-fontPrimaryLight dark:text-fontSecondaryDark">
        Favorite Genres JSON
      </label>
      <label className="flex items-center justify-center px-4 py-2 rounded-xs cursor-pointer bg-primaryLight dark:bg-primaryDark text-fontSecondaryLight dark:text-fontPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark hover:bg-primaryHoverLight dark:hover:bg-primaryHoverDark active:bg-primaryActiveLight dark:active:bg-primaryActiveDark transition-all duration-300">
        Choose File
        <input
          type="file"
          accept="application/json"
          onChange={(e) => {
            if (e.target.files?.[0]) setFavoriteGenres(e.target.files[0]);
          }}
          className="hidden"
        />
      </label>
      {favoriteGenres && (
        <p className="mt-2 text-sm text-primaryLight dark:text-primaryDark">
          {favoriteGenres.name}
        </p>
      )}
    </div>

    {/* Reviews */}
    <div>
      <label className="block mb-2 font-medium text-fontPrimaryLight dark:text-fontSecondaryDark">
        Reviews JSON
      </label>
      <label className="flex items-center justify-center px-4 py-2 rounded-xs cursor-pointer bg-primaryLight dark:bg-primaryDark text-fontSecondaryLight dark:text-fontPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark hover:bg-primaryHoverLight dark:hover:bg-primaryHoverDark active:bg-primaryActiveLight dark:active:bg-primaryActiveDark transition-all duration-300">
        Choose File
        <input
          type="file"
          accept="application/json"
          onChange={(e) => {
            if (e.target.files?.[0]) setReviews(e.target.files[0]);
          }}
          className="hidden"
        />
      </label>
      {reviews && (
        <p className="mt-2 text-sm text-primaryLight dark:text-primaryDark">
          {reviews.name}
        </p>
      )}
    </div>

    {/* Submit */}
    <div className="flex justify-center">
      <button
        type="submit"
        className="px-6 py-3 bg-secondaryLight dark:bg-secondaryDark text-fontPrimaryLight dark:text-fontPrimaryDark font-medium rounded-xs shadow-buttonShadow dark:shadow-buttonShadowDark hover:bg-secondaryHoverLight dark:hover:bg-secondaryHoverDark active:bg-secondaryActiveLight dark:active:bg-secondaryActiveDark transition-all duration-300"
      >
        Add Goodreads Files
      </button>
    </div>
  </form>
</div>

    );
  }
  