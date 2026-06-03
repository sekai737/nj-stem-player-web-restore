import { MEMBERS } from "../data/members";
import type { MemberId } from "../types";

interface MemberPanelProps {
  activeMember: MemberId;
}

const ORDER: MemberId[] = ["minji", "hanni", "danielle", "haerin", "hyein"];

export default function MemberPanel({ activeMember }: MemberPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {ORDER.map((id) => {
        const member = MEMBERS[id];
        const active = id === activeMember;
        return (
          <div
            key={id}
            className={`flex items-center gap-3 rounded-2xl px-2 py-1 transition ${
              active ? "opacity-100" : "opacity-35 grayscale"
            }`}
          >
            <img
              src={member.portrait}
              alt={member.name}
              className="h-12 w-12 rounded-full bg-white object-cover ring-2 ring-white shadow"
            />
            <div>
              <p className="text-sm font-semibold">{member.name}</p>
              <p className="text-lg leading-none">{member.emoji}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
