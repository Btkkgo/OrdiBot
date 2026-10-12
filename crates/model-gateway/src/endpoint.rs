use crate::ModelError;

/// Canonical identity includes scheme, host, port and the entire API base path.
pub struct ModelEndpoint {
    pub canonical: String,
    pub local: bool,
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn endpoint_identity_normalizes_urls_and_rejects_unsafe_variants() {
        assert_eq!(
            ModelEndpoint::parse("https://EXAMPLE.com:443/v1/")
                .unwrap()
                .canonical,
            "https://example.com/v1"
        );
        for value in [
            "http://localhost:11434/v1",
            "http://127.0.0.1:1234/v1",
            "https://[::1]/v1",
            "https://127.0.0.2/v1",
            "https://localhost./v1",
            "http://[::ffff:127.0.0.1]/v1",
        ] {
            assert!(ModelEndpoint::parse(value).unwrap().local);
        }
        for value in [
            "http://localhost.example/v1",
            "http://127.0.0.1.example/v1",
            "http://example.com/v1",
            "ftp://localhost/v1",
            "https://user:fixture@example.com/v1",
            "https://example.com/v1?x=1",
            "https://example.com/v1#part",
            "file:///v1",
        ] {
            assert!(ModelEndpoint::parse(value).is_err());
        }
        assert!(
            !ModelEndpoint::parse("https://localhost.example/v1")
                .unwrap()
                .local
        );
    }
}
impl ModelEndpoint {
    pub fn parse(value: &str) -> Result<Self, ModelError> {
        let invalid = || ModelError::Provider("INVALID_BASE_URL".into());
        let url = reqwest::Url::parse(value).map_err(|_| invalid())?;
        let local = url.host_str().is_some_and(|host| {
            host.trim_end_matches('.').eq_ignore_ascii_case("localhost")
                || host
                    .trim_matches(['[', ']'])
                    .parse::<std::net::IpAddr>()
                    .is_ok_and(|ip| match ip {
                        std::net::IpAddr::V4(ip) => ip.is_loopback(),
                        std::net::IpAddr::V6(ip) => {
                            ip.is_loopback()
                                || ip.to_ipv4_mapped().is_some_and(|ip| ip.is_loopback())
                        }
                    })
        });
        if url.host_str().is_none()
            || !(url.scheme() == "https" || (url.scheme() == "http" && local))
            || !url.username().is_empty()
            || url.password().is_some()
            || url.query().is_some()
            || url.fragment().is_some()
        {
            return Err(invalid());
        }
        Ok(Self {
            canonical: url.as_str().trim_end_matches('/').to_owned(),
            local,
        })
    }
}
