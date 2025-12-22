import ProtectedPage from "@/container/firewall";

export default function Home() {
  return (
    <ProtectedPage>
      <div>
        <h1 className="text-3xl">Home Page</h1>
      </div>
    </ProtectedPage>
  );
}
