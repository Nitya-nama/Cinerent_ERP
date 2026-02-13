export default function StatCard({title,value}) {
  return (
    <div className="card">
      <p className="text-secondary text-sm">{title}</p>
      <h2 className="text-3xl mt-2">{value}</h2>
    </div>
  );
}
