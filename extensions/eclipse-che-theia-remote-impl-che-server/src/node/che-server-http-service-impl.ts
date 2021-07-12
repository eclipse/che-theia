/**********************************************************************
 * Copyright (c) 2021 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 ***********************************************************************/

import * as https from 'https';
import * as tunnel from 'tunnel';
import * as url from 'url';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { inject, injectable } from 'inversify';

import { CertificateService } from '@eclipse-che/theia-remote-api/lib/common/certificate-service';
import { HttpService } from '@eclipse-che/theia-remote-api/lib/common/http-service';

@injectable()
export class CheServerHttpServiceImpl implements HttpService {
  @inject(CertificateService)
  private certificateService: CertificateService;

  async get(uri: string): Promise<string | undefined> {
    const axiosInstance = await this.getAxiosInstance(uri);
    try {
      const response = await axiosInstance.get(uri, {
        transformResponse: [data => data],
        responseType: 'text',
      });
      return response.data;
    } catch (error) {
      // not found then we return undefined
      if (error.response && error.response.status === 404) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Use proxy and/or certificates.
   */
  private async getAxiosInstance(uri: string): Promise<AxiosInstance> {
    const certificateAuthority = await this.certificateService.getCertificateAuthority();

    const proxyUrl = process.env.http_proxy;
    const baseUrl = process.env.CHE_API_EXTERNAL;
    console.log('proxyUrl && proxyUrl !== && baseUrl', proxyUrl && proxyUrl !== '' && baseUrl);
    if (proxyUrl && proxyUrl !== '' && baseUrl) {
      const parsedBaseUrl = url.parse(baseUrl);
      if (parsedBaseUrl.hostname && this.shouldProxy(parsedBaseUrl.hostname)) {
        const axiosRequestConfig: AxiosRequestConfig | undefined = {
          proxy: false,
        };
        const parsedProxyUrl = url.parse(proxyUrl);
        const mainProxyOptions = this.getMainProxyOptions(parsedProxyUrl);
        const httpsProxyOptions = this.getHttpsProxyOptions(
          mainProxyOptions,
          parsedBaseUrl.hostname,
          certificateAuthority
        );
        const httpOverHttpAgent = tunnel.httpOverHttp({ proxy: mainProxyOptions });
        const httpOverHttpsAgent = tunnel.httpOverHttps({ proxy: httpsProxyOptions });
        const httpsOverHttpAgent = tunnel.httpsOverHttp({
          proxy: mainProxyOptions,
          ca: certificateAuthority ? certificateAuthority : undefined,
        });
        const httpsOverHttpsAgent = tunnel.httpsOverHttps({
          proxy: httpsProxyOptions,
          ca: certificateAuthority ? certificateAuthority : undefined,
        });
        const urlIsHttps = (parsedBaseUrl.protocol || 'http:').startsWith('https:');
        const proxyIsHttps = (parsedProxyUrl.protocol || 'http:').startsWith('https:');
        if (urlIsHttps) {
          axiosRequestConfig.httpsAgent = proxyIsHttps ? httpsOverHttpsAgent : httpsOverHttpAgent;
        } else {
          axiosRequestConfig.httpAgent = proxyIsHttps ? httpOverHttpsAgent : httpOverHttpAgent;
        }
        return axios.create(axiosRequestConfig);
      }
    }

    if (uri.startsWith('https') && certificateAuthority) {
      return axios.create({
        httpsAgent: new https.Agent({
          ca: certificateAuthority,
        }),
      });
    }

    return axios;
  }

  private getHttpsProxyOptions(
    mainProxyOptions: tunnel.ProxyOptions,
    servername: string | undefined,
    certificateAuthority: Buffer[] | undefined
  ): tunnel.HttpsProxyOptions {
    return {
      host: mainProxyOptions.host,
      port: mainProxyOptions.port,
      proxyAuth: mainProxyOptions.proxyAuth,
      servername,
      ca: certificateAuthority ? certificateAuthority : undefined,
    };
  }

  private getMainProxyOptions(parsedProxyUrl: url.UrlWithStringQuery): tunnel.ProxyOptions {
    const port = Number(parsedProxyUrl.port);
    return {
      host: parsedProxyUrl.hostname!,
      port: parsedProxyUrl.port !== '' && !isNaN(port) ? port : 3128,
      proxyAuth: parsedProxyUrl.auth && parsedProxyUrl.auth !== '' ? parsedProxyUrl.auth : undefined,
    };
  }

  private shouldProxy(hostname: string): boolean {
    const noProxyEnv = process.env.no_proxy || process.env.NO_PROXY;
    const noProxy: string[] = noProxyEnv ? noProxyEnv.split(',').map(s => s.trim()) : [];
    return !noProxy.some(rule => {
      if (!rule) {
        return false;
      }
      if (rule === '*') {
        return true;
      }
      if (rule[0] === '.' && hostname.substr(hostname.length - rule.length) === rule) {
        return true;
      }
      return hostname === rule;
    });
  }
}
