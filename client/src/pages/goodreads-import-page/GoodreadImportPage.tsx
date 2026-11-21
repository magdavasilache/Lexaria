import { FormEvent, useState } from "react";
import { authorizedAxios } from "../../api/authorizedAxios";
import Button from "../../global-components/buttons/Button";

const GOODREADS_UPLOAD_TIMEOUT_MS = 60_000;

export default function GoodreadsImportPage() {
    const [favoriteGenres, setFavoriteGenres] = useState<File | null>(null);
    const [reviews, setReviews] = useState<File | null>(null);
  
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
    
      if (!favoriteGenres || !reviews) {
        alert("Please select both files before uploading.");
        return;
      }
    
      const formData = new FormData();
      formData.append("favorite_genres", favoriteGenres);
      formData.append("reviews", reviews);
    
      try {
        await authorizedAxios("book").post("/process_goodreads_data", formData, { timeout: GOODREADS_UPLOAD_TIMEOUT_MS });
        alert("Files imported successfully!");
      } catch {
        return;
      }
    };
    
    return (
<div className="w-full h-screen p-6 flex items-center justify-center bg-backgroundLight dark:bg-backgroundDark">
  <form
    onSubmit={handleSubmit}
    className="max-w-2xl w-full bg-paperLight dark:bg-paperDark rounded-xs shadow-cardShadowLight dark:shadow-cardShadowDark p-8 space-y-6 animate-slide-in"
  >
    <h1 className="text-3xl font-libre font-bold text-fontPrimaryLight dark:text-fontPrimaryDark">
      Import Your Goodreads Data
    </h1>

    <p className="text-fontPrimaryLight dark:text-fontPrimaryDark leading-relaxed">
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
      <label className="block mb-2 font-medium text-fontPrimaryLight dark:text-fontPrimaryDark">
        Favorite Genres JSON
      </label>
      <label className="flex items-center justify-center px-4 py-2 rounded-xs cursor-pointer bg-primaryLight dark:bg-primaryDark text-onPrimaryLight dark:text-onPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark hover:bg-primaryHoverLight dark:hover:bg-primaryHoverDark active:bg-primaryActiveLight dark:active:bg-primaryActiveDark transition-all duration-300">
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
      <label className="block mb-2 font-medium text-fontPrimaryLight dark:text-fontPrimaryDark">
        Reviews JSON
      </label>
      <label className="flex items-center justify-center px-4 py-2 rounded-xs cursor-pointer bg-primaryLight dark:bg-primaryDark text-onPrimaryLight dark:text-onPrimaryDark shadow-buttonShadow dark:shadow-buttonShadowDark hover:bg-primaryHoverLight dark:hover:bg-primaryHoverDark active:bg-primaryActiveLight dark:active:bg-primaryActiveDark transition-all duration-300">
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
      <Button type="submit" variant="secondary" size="lg">
        Add Goodreads Files
      </Button>
    </div>
  </form>
</div>

    );
  }
  