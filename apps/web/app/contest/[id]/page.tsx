import { Contest } from "../../../components/Contest";

export default async function ContestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) {
    return <div>Contest doesnt exist...</div>;
  }

  return <Contest id={id} />;
}

export const dynamic = "force-dynamic";
