export async function platformFetch(url: string, options: any = {}) {
    const res = await fetch(url, options);

    if (!res.ok) {
        let errorData;
        try {
            errorData = await res.json();
        } catch (e) {
            errorData = await res.text();
        }

        if (res.status >= 400 && res.status < 500) {
            throw new Error(`Client Error [${res.status}]: ${JSON.stringify(errorData)}`);
        }
        if (res.status >= 500) {
            throw new Error(`Server Error [${res.status}]: ${JSON.stringify(errorData)}`);
        }
    }

    return res.json();
}
