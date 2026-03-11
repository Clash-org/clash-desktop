import { AUTH_HOST, CITY_HOST, CLUB_HOST, NOMINATION_HOST, TOURNAMENT_HOST, UPLOAD_HOST, WEAPON_HOST } from '@/constants';
import { CityType, ClubType, NominationType, NominationUsersType, RegistrationType, TournamentFormData, TournamentShortType, TournamentType, UserType, WeaponType } from '@/typings';
import toast from 'react-hot-toast';
import { LocalStorage } from './helpers';

async function getHeaderWithToken() {
    return {
        "Authorization": `Bearer ${await LocalStorage.getItem("accessToken")}`
    } as HeadersInit
}

export const registrationApi = {
    createUser: async (email: string, username: string, password: string, cityId: number|null, clubId: number|null, gender: boolean, lang: string, cityName?: string, clubName?: string) => {
        const res = await fetch(AUTH_HOST + "register", {
            method: "POST",
            body: JSON.stringify({ email, username, password, cityId, clubId, gender, cityName, clubName, lang })
        })
        if (res.status === 201) {
            return (await res.json()) as RegistrationType
        } else {
            toast.error(res.statusText)
        }
    },
    login: async (email: string, password: string, lang: string) => {
        const res = await fetch(AUTH_HOST + "login", {
            method: "POST",
            body: JSON.stringify({ email, password, lang })
        })
        if (res.status === 200) {
            return (await res.json()) as RegistrationType
        } else {
            toast.error(res.statusText)
        }
    },
    me: async (lang: string) => {
        try {
            const res = await fetch(AUTH_HOST + `me?lang=${lang}`, {
                headers: await getHeaderWithToken()
            })
            if (res.status === 200) {
                return (await res.json()) as UserType
            } else {
                toast.error(res.statusText)
            }
        } catch(e){}
    },
    refresh: async () => {
        try {
            const refreshToken = await LocalStorage.getItem("refreshToken")
            if (refreshToken) {
                const res = await fetch(AUTH_HOST + "refresh", {
                    method: "POST",
                    body: JSON.stringify({ refresh: refreshToken })
                })
                if (res.status === 200) {
                    return (await res.json()) as Omit<RegistrationType, "user">
                } else {
                    toast.error(res.statusText)
                }
            }
        } catch {}
    }
}

export const citiesApi = {
    getAll: async (lang: string) => {
        const res = await fetch(CITY_HOST + `?lang=${lang}`)
        if (res.status === 200) {
            return (await res.json()) as CityType[]
        } else {
            toast.error(res.statusText)
        }
    },
    getById: async (id: number) => {
        const res = await fetch(CITY_HOST + `/${id}`)
        if (res.status === 200) {
            return (await res.json()) as CityType
        } else {
            toast.error(res.statusText)
        }
    }
}

export const clubsApi = {
    getAll: async () => {
        const res = await fetch(CLUB_HOST)
        if (res.status === 200) {
            return (await res.json()) as ClubType[]
        }
    },
    getById: async (id: number) => {
        const res = await fetch(CLUB_HOST + `/${id}`)
        if (res.status === 200) {
            return (await res.json()) as ClubType
        } else {
            toast.error(res.statusText)
        }
    }
}

export const tournamentsApi = {
    getAll: async (lang: string, short?: boolean) => {
        const res = await fetch(TOURNAMENT_HOST + `?lang=${lang}&short=${short}`)
        if (res.status === 200) {
            if (short)
                return (await res.json()) as TournamentShortType[]
            return (await res.json()) as TournamentType[]
        } else {
            toast.error(res.statusText)
        }
    },
    getById: async (id: number, lang: string) => {
        const res = await fetch(TOURNAMENT_HOST + `/${id}?lang=${lang}`)
        if (res.status === 200) {
            return (await res.json()) as TournamentType
        } else {
            toast.error(res.statusText)
            console.error(await res.json())
        }
    },
    create: async (data: TournamentFormData) => {
        const res = await fetch(TOURNAMENT_HOST, {
            method: "POST",
            body: JSON.stringify(data),
            headers: await getHeaderWithToken()
        })
        if (res.status === 201) {
            return (await res.json()) as TournamentType
        } else {
            toast.error(res.statusText)
        }
    },
    update: async (data: TournamentFormData, tournamentId: number) => {
        const res = await fetch(TOURNAMENT_HOST, {
            method: "PUT",
            body: JSON.stringify({ ...data, tournamentId }),
            headers: await getHeaderWithToken()
        })
        if (res.status === 200) {
            return (await res.json()) as TournamentType
        } else {
            toast.error(res.statusText)
        }
    },
    getParticipants: async (tournamentId: number, nominationIds: number[]) => {
        const res = await fetch(TOURNAMENT_HOST + `/${tournamentId}/participants?nominationIds=${JSON.stringify(nominationIds)}`)
        if (res.status === 200) {
            return (await res.json()) as NominationUsersType
        } else {
            toast.error(res.statusText)
        }
    },
    getTournamentsByOrganizer: async (uuid: string) => {
        const res = await fetch(TOURNAMENT_HOST + `/organizer/${uuid}`)
        if (res.status === 200) {
            return (await res.json()) as TournamentType[]
        } else {
            toast.error(res.statusText)
        }
    },
    delete: async (tournamentId: number) => {
        const res = await fetch(TOURNAMENT_HOST, {
            method: "DELETE",
            body: JSON.stringify({ tournamentId }),
            headers: await getHeaderWithToken()
        })
        if (res.status === 200) {
            return (await res.json()) as { success: boolean }
        } else {
            toast.error(res.statusText)
        }
    }
}

export const weaponsApi = {
    getWeaponsAll: async () => {
        const res = await fetch(WEAPON_HOST)
        if (res.status === 200) {
            return (await res.json()) as WeaponType[]
        } else {
            toast.error(res.statusText)
        }
    },
    getNominationsAll: async (lang: string) => {
        const res = await fetch(NOMINATION_HOST + `?lang=${lang}`)
        if (res.status === 200) {
            return (await res.json()) as NominationType[]
        } else {
            toast.error(res.statusText)
        }
    }
}

export const uploadsApi = {
    imageLoad: async (formData: FormData, dir: "covers"|"profiles") => {
        const res = await fetch(UPLOAD_HOST + `/image?dir=${dir}`, {
            method: "POST",
            headers: await getHeaderWithToken(),
            body: formData
        })
        if (res.status === 201) {
            return (await res.json()) as string
        } else {
            toast.error(res.statusText)
        }
    }
}