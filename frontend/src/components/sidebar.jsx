export default function Sidebar() {
  return (
    <div className="sidebar" style={{ width: '250px', background: '#333', color: '#fff', minHeight: '100vh' }}>
      <nav>
        <ul style={{ listStyle: 'none', padding: '20px' }}>
          <li>Dashboard</li>
          <li>Grievances</li>
          <li>Logout</li>
        </ul>
      </nav>
    </div>
  );
}