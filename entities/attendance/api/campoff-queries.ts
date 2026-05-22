import { apiFetch } from "@/shared/api";

export type CampOffMatrixUser = {
  available: number;
  credited: number;
  consumed: number;
  creditedDays: number[];
  leaveDays: number[];
  weekOffDays: number[];
  weekOffUsesCompanyDefault: boolean;
};

export type CampOffMatrixResponse = {
  byUser: Record<string, CampOffMatrixUser>;
  companyWeekOffDays: number[];
};

const CAMP_OFF_BATCH_SIZE = 40;

async function fetchCampOffMatrixBatch(params: {
  startDate: string;
  endDate: string;
  userIds: string[];
}): Promise<CampOffMatrixResponse> {
  const qs = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
    userIds: params.userIds.join(","),
  });
  const res = await apiFetch<CampOffMatrixResponse>(
    `/api/hrm/attendance/campoff-matrix?${qs.toString()}`,
  );
  return {
    byUser: res.byUser ?? {},
    companyWeekOffDays: res.companyWeekOffDays ?? [0],
  };
}

/** Camp-off is optional for grid rendering — never fail the whole matrix. */
export async function fetchCampOffMatrix(params: {
  startDate: string;
  endDate: string;
  userIds: string[];
}): Promise<CampOffMatrixResponse> {
  if (!params.userIds.length) return { byUser: {}, companyWeekOffDays: [0] };

  try {
    const ids = [...new Set(params.userIds)];
    if (ids.length <= CAMP_OFF_BATCH_SIZE) {
      return await fetchCampOffMatrixBatch({ ...params, userIds: ids });
    }

    const byUser: Record<string, CampOffMatrixUser> = {};
    let companyWeekOffDays: number[] = [0];

    for (let i = 0; i < ids.length; i += CAMP_OFF_BATCH_SIZE) {
      const chunk = ids.slice(i, i + CAMP_OFF_BATCH_SIZE);
      const res = await fetchCampOffMatrixBatch({
        startDate: params.startDate,
        endDate: params.endDate,
        userIds: chunk,
      });
      Object.assign(byUser, res.byUser);
      if (res.companyWeekOffDays?.length) {
        companyWeekOffDays = res.companyWeekOffDays;
      }
    }

    return { byUser, companyWeekOffDays };
  } catch {
    return { byUser: {}, companyWeekOffDays: [0] };
  }
}
