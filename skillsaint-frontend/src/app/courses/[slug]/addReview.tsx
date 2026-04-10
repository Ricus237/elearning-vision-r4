"use client";
import Button from "@/components/ui/button";
import Textarea from "@/components/ui/textarea";
import { Star } from "@/lib/icons";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

type ReviewForm = {
  name: string;
  email: string;
  message: string;
};

const AddReview = () => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewForm>();

  const onSubmit = async () => {
    if (rating === 0) {
      toast.error("Please provide a rating");
      return;
    }

    try {
      const res = await new Promise<{ ok: boolean }>((resolve) => {
        setTimeout(() => {
          resolve({ ok: true }); // simulate API response
        }, 2000);
      });

      if (!res.ok) {
        toast.error("Failed to add comment");
        return;
      }

      toast.success("Comment added successfully");
      reset();
      setRating(0);
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(() => onSubmit())}
      className="mt-12 rounded-[3rem] bg-white border border-gray-100 p-8 shadow-sm"
    >
      <h6 className="mb-6 text-xl font-black text-gray-900 tracking-tight">Share Your Perspective</h6>
      
      <div className="w-full mb-8">
        <label
          htmlFor="rating"
          className="mb-3 block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1"
        >
          Your Assessment
        </label>
        <ul className="flex items-center gap-2 bg-gray-50 w-fit p-3 rounded-2xl border border-gray-100">
          {[1, 2, 3, 4, 5].map((star) => (
            <li key={star}>
              <button
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-all duration-300"
              >
                <Star
                  className={`size-6 ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  } hover:scale-125 transition-transform`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full">
        <label
          htmlFor="message"
          className="mb-3 block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1"
        >
          Academic Feedback
        </label>
        <Textarea
          id="message"
          className="min-h-[160px] bg-gray-50 border-2 border-transparent focus:border-purple-600 focus:bg-white rounded-[2rem] p-6 text-sm font-medium transition-all"
          placeholder="Reflect on your learning journey..."
          {...register("message", {
            required: "Message is required",
            minLength: {
              value: 10,
              message: "Message must be at least 10 characters",
            },
          })}
          dataState={errors.message ? "error" : "default"}
        />
        {errors.message && (
          <span className="text-xs font-bold text-red-500 mt-2 block ml-2">
            {errors.message.message}
          </span>
        )}
      </div>
      <Button 
        disabled={isSubmitting} 
        className="mt-8 w-full py-4 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-gray-200 hover:bg-purple-600 transition-all flex items-center justify-center gap-3"
      >
        {isSubmitting ? "Dispatching..." : "Transmit Review"}
      </Button>
    </form>
  );
};

export default AddReview;
