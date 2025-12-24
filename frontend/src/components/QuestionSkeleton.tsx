export function QuestionSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Imagen placeholder */}
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6" />
      
      {/* Botones de opciones */}
      <div className="flex justify-center gap-4 flex-wrap">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
