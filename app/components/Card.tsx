type CardProps = {
  title: string;
  value: string;
};

export default function Card({
  title,
  value,
}: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6">
      <p className="text-gray-500">{title}</p>

      <h2 className="text-3xl font-bold">
        {value}
      </h2>
    </div>
  );
}