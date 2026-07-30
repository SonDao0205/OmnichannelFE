/**
 * axiosClient — tái sử dụng managementApi từ authApi.ts
 * Dùng chung: baseURL port 8081, withCredentials (cookie session), XSRF token tự động.
 */
import { managementApi } from './authApi'

export const axiosClient = managementApi
