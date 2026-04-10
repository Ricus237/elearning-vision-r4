"use client";
import Avatar from "@/components/ui/avatar";
import { StarDisplay } from "@/components/ui/starDisplay";
import { Star } from "@/lib/icons";
import { cn, formatDate } from "@/lib/utils";

interface Review {
  _id: string;
  review: string;
  _createdAt: string;
  rating: number;
  reviewerName: string;
  reviewerImage: string;
}

const reviews: Review[] = []; // Real reviews would be fetched here

const CoursseReview = () => {
  return (
    <div className="pt-8">
      <div className="mb-7 flex items-center justify-between rounded-[2.5rem] bg-gray-50 p-8 border border-gray-100">
        <h5 className="text-xl font-black text-gray-900 tracking-tight sm:text-2xl">Scholar Feedback</h5>
        <div className="flex items-center gap-x-3">
          <span className="text-yellow-400">
            <Star className="size-6 fill-yellow-400" />
          </span>
          <div className="flex flex-col items-end">
             <h6 className="text-2xl leading-none font-black text-gray-900">{reviews.length > 0 ? "4.5" : "N/A"}</h6>
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">Global Rating</p>
          </div>
        </div>
      </div>
      
      {/* review display */}
      <div className="space-y-8">
        {reviews.length > 0 ? (
          reviews.map(
            (
              { _id, review, _createdAt, rating, reviewerName, reviewerImage },
              index,
            ) => {
              const isLast = index === reviews.length - 1;
              return (
                <div
                  key={_id}
                  className={cn(
                    "mb-6 border-b border-b-gray-100 pb-10",
                    isLast && "mb-0 border-none pb-0",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar
                        img={reviewerImage}
                        name={reviewerName}
                        className="h-16 w-16 bg-purple-50 ring-4 ring-white shadow-sm"
                      />
                      <div>
                        <p className="text-lg font-black text-gray-900 tracking-tight">
                          {reviewerName}
                        </p>
                        <small className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {formatDate(_createdAt)}
                        </small>
                      </div>
                    </div>
                    <StarDisplay value={rating} />
                  </div>
                  <p className="mt-6 text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-6 rounded-[2rem] border border-gray-50 italic">
                    &quot;{review}&quot;
                  </p>
                </div>
              );
            },
          )
        ) : (
          <div className="py-16 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 shadow-sm">
                <Star className="size-8" />
             </div>
             <h6 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-2">No Reviews Yet</h6>
             <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">Be the first to share your academic experience for this program.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursseReview;
